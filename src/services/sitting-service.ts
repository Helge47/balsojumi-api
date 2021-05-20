import { AttendanceRegistration, Motion, Sitting, SittingType, Voting } from "../entities";
import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import { MoreThan, Repository } from "typeorm";
import axios from 'axios';
import { convertDate, fixLatvianString } from "../util/util";
import { LoggingService } from "./logging-service";

@Service()
export class SittingService {
    
    private readonly sittingRegex = /dCC\("(\d*)","(\d{4})","(\d{1,2})","(\d{1,2})","(\d{1,2})","(\d{1,2})","(.*)"\)/gm;
    private readonly readingRegex = /drawDKP_Pr\((".*?",){3}"(?<motionNumber>.*?)",".*?","(?<uid>.*?)"(,".*?"){6},"(?<docs>.*?)".*?\)/gm;
    private readonly votingRegex = /addVotesLink\("(.*)","(.*)"(,".*"){3}\);/gm;
    private readonly attendanceRegex = /drawDKP_UT\("","","Deputātu klātbūtnes reģistrācija","","","(?<uid>.*?)"/gm;

    private readonly errors: string[] = [];
    
    constructor(
        @InjectRepository(Sitting) private readonly sittingRepository: Repository<Sitting>,
        @InjectRepository(AttendanceRegistration) private readonly attendanceRepository: Repository<AttendanceRegistration>,
        @InjectRepository(Motion) private readonly motionRepository: Repository<Motion>,
        @InjectRepository(Voting) private readonly votingRepository: Repository<Voting>,
        private readonly logger: LoggingService,
    ) {}

    async run() {
        this.logger.log('Running SittingService!');
        await this.updateSittings();
        await this.updateSittingDetails();
        this.logger.log('SittingService Finished work!');
    }

    async updateSittings() {
        const response = await axios.get('https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/DK?ReadForm&calendar=1');
        const page = fixLatvianString(response.data);
        
        const uids: string[] = (await this.sittingRepository.find()).map(s => s.saeimaUid);
        let match;
        const sittings: Sitting[] = [];
    
        while (match = this.sittingRegex.exec(page)) {
            const uid = match[7];
    
            if (!uids.some(u => u === uid)) {
                uids.push(uid);

                const year = parseInt(match[2]);
                const month = parseInt(match[3]);
                const day = parseInt(match[4]);
                const date = year + '-' + month + '-' + day;
    
                const modifier = parseInt(match[5]);
                let type: SittingType = 'default';
    
                if (modifier === 2) {
                    type = 'emergency';
                } else if (modifier === 3) {
                    type = 'formal';
                } else if (modifier === 4) {
                    type = 'closed';
                } else if (modifier === 5) {
                    type = 'qa';
                } else if (modifier === 6) {
                    type = 'emergencySession';
                }
    
                const sitting = this.sittingRepository.create({
                    date: date,
                    saeimaUid: uid,
                    type: type
                });
    
                sittings.push(sitting);
            }
        }

        this.sittingRegex.lastIndex = 0;
        sittings.sort((a, b) => a.date.localeCompare(b.date));

        try {
            this.logger.log(sittings);
            return this.sittingRepository.save(sittings);
        } catch (e) {
            this.logger.error(e);
        }
    }

    async updateSittingDetails() {
        const monthBefore = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const monthBeforeDate = convertDate(monthBefore.toLocaleDateString());
        const sittings = await this.sittingRepository.find({
            where: { date: MoreThan('2021-03-01') },
            order: { id: 'ASC' },
            relations: [
                'readings',
                'readings.motion',
                'readings.votings',
                'attendanceRegistrations',
            ]
        });

        for (const i in sittings) {
            const s = sittings[i];
            this.logger.log('processing sitting', s.id)
            await this.processSitting(s);
        }

        this.logger.log(JSON.stringify(this.errors));
    }

    private async processSitting(sitting: Sitting) {
        const url = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/DK?ReadForm&nr=' + sitting.saeimaUid;
        const response = await axios.get(url);
        const page = fixLatvianString(response.data);
    
        const votingUids: { motionUid: string, uid: string }[] = [];
        let match;
    
        while (match = this.votingRegex.exec(page)) {
            const motionUid = match[1];
            const votingUid = match[2];
    
            if (!votingUids.some(v => v.motionUid === motionUid && v.uid === votingUid)) {
                votingUids.push({ motionUid: motionUid, uid: votingUid });
            }
        }
        this.votingRegex.lastIndex = 0;
        this.logger.log('votings', votingUids);
    
        while (match = this.readingRegex.exec(page)) {
            const { uid, motionNumber, docs } = match.groups;
    
            if (!motionNumber || motionNumber === '26/Lp13') {
                this.errors.push('no motion ' + uid + ' ' + motionNumber);
                this.logger.log('No motion');
                continue;
            }
    
            const motion = await this.motionRepository.findOne(
                { number: motionNumber },
                { relations: ['readings', 'readings.motion', 'readings.votings'] }
            );
            if (motion === undefined) {
                throw 'Motion ' + motionNumber + ' not found in the database. Make sure you run all motion update scripts first.';
            }
    
            let reading = sitting.readings.find(r => r.motion.uid === motion.uid);
            if (reading === undefined) {
                reading = motion.readings.find(r => docs.includes(r.docs));
                if (reading === undefined) {
                    this.logger.error('no such reading for this motion ' + docs + ' ' + motion.id);
                    this.errors.push('no such reading for this motion ' + docs + ' ' + motion.id);
                    continue;
                }
            } else {
                this.logger.log('Sitting already has reading for this motion, updating it');
            }

            if (reading.votings === undefined) {
                reading.votings = [];
            }

            const votingUid = votingUids.find(v => v.motionUid === uid);
            if (votingUid !== undefined && reading.votings.every(v => v.uid !== votingUid.uid)) {
                const voting = this.votingRepository.create({
                    uid: votingUid.uid,
                    method: 'default',
                    type: 'primary',
                });
                reading.votings.push(voting);
            }
    
            //TODO: Parse secondary votings
    
            sitting.readings.push(reading);
            this.logger.log('reading updated', reading);
        }
        this.readingRegex.lastIndex = 0;

        if (sitting.attendanceRegistrations === undefined) {
            sitting.attendanceRegistrations = [];
        }

        while (match = this.attendanceRegex.exec(page)) {
            const { uid } = match.groups;
            const votingUid = votingUids.find(v => v.motionUid === uid);

            if (votingUid === undefined) {
                this.errors.push('No voting found for attendance registration ' + uid)
                continue;
            }

            if (sitting.attendanceRegistrations.some(r => r.uid === uid)) {
                this.logger.log('this attendance registration is already saved', uid);
                continue;
            }

            const registration = this.attendanceRepository.create({
                sitting: sitting,
                uid: uid,
                votingUid: votingUid.uid,
            });
            sitting.attendanceRegistrations.push(registration);
            this.logger.log('new attendance registration', registration);
        }
        this.attendanceRegex.lastIndex = 0;

        await this.sittingRepository.save(sitting);
    };
}