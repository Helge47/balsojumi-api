import { AttendanceRegistration, Deputy, Motion, Reading, Vote, VoteType, Voting } from "../entities";
import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import axios from 'axios';
import { convertDate, convertDateTime, fixLatvianString } from "../scripts/util";
import { LoggingService } from "./logging-service";

@Service()
export class VoteService {
    private readonly votesRegex = /voteFullListByNames=\["(.*)"\];/gm;
    private readonly votingDateRegex = /Datums: <\/span><b>(?<datetime>.*?)<\/b>/gm;
    private readonly separator = '�';

    constructor(
        @InjectRepository(Vote) private readonly voteRepository: Repository<Vote>,
        @InjectRepository(Voting) private readonly votingRepository: Repository<Voting>,
        @InjectRepository(Deputy) private readonly deputyRepository: Repository<Deputy>,
        @InjectRepository(AttendanceRegistration) private readonly attendanceRepository: Repository<AttendanceRegistration>,

        private readonly logger: LoggingService,
    ) {}

    async updateVotes() {
        const votings = await this.votingRepository.find({ where: { method: 'default' }, relations: [ 'votes' ] });

        for (const i in votings) {
            const voting = votings[i];
            this.logger.log('Processing voting ' + voting.id);
    
            await this.processVoting(voting);
        }

        const attendanceRegistrations = await this.attendanceRepository.find({ relations: ['attendees', 'absentees']});

        for (const i in attendanceRegistrations) {
            const r = attendanceRegistrations[i];
            this.logger.log('Processing attendance', r);

            await this.processRegistration(r);
        }
    }

    private async processVoting(voting: Voting) {
        if (voting.votes.length > 0) {
            this.logger.log('already has votes, skipping', voting.id);
            return;
        }
    
        const url = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/0/' + voting.uid;
        const response = await axios.get(url);
        const page: string = response.data;
        this.logger.log(page);
    
        const deputies: Deputy[] = await this.deputyRepository.find();
        const match = page.match(this.votesRegex);
        this.logger.log(match);
    
        if (match === null || match[1] === '') {
            this.logger.log('The voting was anonymous, skipping');
            return;
        }
    
        const voteData = match[1].split('","');
        voting.votes = [];
    
        const { datetime } = page.match(this.votingDateRegex).groups;
        voting.date = new Date(convertDateTime(datetime));
    
        for (const i in voteData) {
            const [ orderNumber, name, partyName, voteType ] = voteData[i].split(this.separator);
            const fixedName = fixLatvianString(name);
            const fixedFaction = fixLatvianString(partyName);
    
            const deputy = deputies.find(d => {
                return fixedName.includes(d.surname) && fixedName.includes(d.name);
                return d.surname + ' ' + d.name === fixedName || 
                    d.surname.split('-')[0] + ' ' + d.name === fixedName;
            });
    
            if (deputy === undefined) {
                this.logger.error('Deputy not found: ' + fixedName);
                throw 'Deputy not found ' + fixedName;
            }
    
            if (deputy.currentFaction !== fixedFaction) {
                deputy.currentFaction = fixedFaction;
                this.logger.log('new faction ', deputy);
                await this.deputyRepository.save(deputy);
            }
    
            const vote = this.voteRepository.create({
                voting: voting,
                deputy: deputy,
                currentDeputyFaction: fixedFaction,
                type: voteType as VoteType,
            });

            voting.votes.push(vote);
        }
    
        this.votingRepository.save(voting);
        this.logger.log('votes saved', voting);
    }

    async processRegistration(r: AttendanceRegistration) {
        if (r.absentees.length > 0 || r.attendees.length > 0) {
            this.logger.log('already parsed this one', r.id);
            return;
        }

        const deputies: Deputy[] = await this.deputyRepository.find();

        const url = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/0/' + r.votingUid;
        const response = await axios.get(url);
        const page: string = response.data;

        const { datetime } = page.match(this.votingDateRegex).groups;
        r.date = new Date(convertDateTime(datetime));

        const match = page.match(this.votesRegex);
        if (match === null || match[1] === '') {
            throw 'no registration data found';
        }

        const voteData = match[1].split('","');
        for (const i in voteData) {
            const [ orderNumber, name, partyName, voteType ] = voteData[i].split(this.separator);
            const fixedName = fixLatvianString(name);
    
            const deputy = deputies.find(d => {
                return fixedName.includes(d.surname) && fixedName.includes(d.name);
            });
    
            if (deputy === undefined) {
                throw 'Deputy not found: ' + fixedName;
            }
    
            if (voteType.includes('Ne')) {
                r.absentees.push(deputy);
            } else {
                r.attendees.push(deputy);
            }
        }
    
        console.log('registration parsed', r);
        await this.attendanceRepository.save(r);
        return;
    }
}