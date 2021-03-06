import { Deputy, Motion, Reading } from "../entities";
import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import axios from 'axios';
import { convertDate, fixLatvianString } from "../util/util";
import { LoggingService } from "./logging-service";

@Service()
export class MotionService {
    private readonly motionRegex = /dvRow_LPView\("(?<lastStatus>.*)","(?<title>.*)","(?<number>.*)","(?<uid>.*)","(.*)"\);/gm;
    private readonly motionRowRegex = /<tr class=".+?">(\n.*)+?\n<\/tr>/gm;
    private readonly motionInfoRowRegex = /<tr class="infoRowCT">(\n.*)+?\n<\/tr>/gm;
    private readonly motionRowDataRegex = /\s*?<td.*?>(.+?)<\/td>/gm;
    private readonly submitterRegex = /Iesniedzēj.: <\/font>(.+?)<\/div>/;
    private readonly referentRegex = /Referent.: <\/font>(.*?)&/;
    private readonly altReferentRegex = /Adresāt.: <\/font>(.*?)</;
    private readonly commissionNameRegex = /komisija:\s+<div.+?>(.*?)<\/div>/;
    private readonly docNumberRegex = /'pielikums'>(.*?)</gm;
    
    constructor(
        @InjectRepository(Motion) private readonly motionRepository: Repository<Motion>,
        @InjectRepository(Reading) private readonly readingRepository: Repository<Reading>,
        @InjectRepository(Deputy) private readonly deputyRepository: Repository<Deputy>,
        private readonly logger: LoggingService,
    ) {}

    async run() {
        this.logger.log('running MotionService');
        await this.updateBills();
        await this.updateDecisions();
        await this.updateInquires();
        await this.updateRequests();
        this.logger.log('updated all motions, now updating submitters');
        await this.updateSubmitters();
        this.logger.log('MotionService finished working');
    }

    async updateSubmitters() {
        const deputies = await this.deputyRepository.find();
        const allMotions = await this.motionRepository.find({ relations: ['submitters'] });

        for (const i in allMotions) {
            const m = allMotions[i];
            this.logger.log('updating motion', m.id);

            if (m.submitters !== null && m.submitters.length > 0) {
                this.logger.log('motion ', m.number, 'already has submitters');
                continue;
            }

            const exceptions = [
                'Ministru kabinets',
                'Valsts prezidents',
                'Deputāti', // for formal motions when a new parliament is elected
                'Ministru prezidenta amata kandidāts Arturs Krišjānis Kariņš',
                'Latvijas Republikas tiesībsargs',
                'Ministru prezidents Arturs Krišjānis Kariņš',
                'Pilsoņu kolektīvais iesniegums',
            ];

            if (m.submittersText === '') {
                if (m.title.includes('pilsoņu kolektīvā')) {
                    m.submittersText = 'Pilsoņu kolektīvais iesniegums';
                } else {
                    this.logger.log('no submitters specified', m.number);
                }
            } else if (m.submittersText.includes('komisija')) {
                this.logger.log('commission', m.submittersText);
            } else if (exceptions.includes(m.submittersText)) {
                this.logger.log(m.submittersText);
            } else {
                const deputyNames = m.submittersText.replace('Deputāti ', '').split(', ');
                this.logger.log('deputies', deputyNames);

                if (m.submitters === undefined) {
                    m.submitters = [];
                }

                for (const j in deputyNames) {
                    const fullName = deputyNames[j];

                    const deputy = deputies.find(d => {
                        return fullName.includes(d.surname) && fullName.includes(d.name);
                    });

                    if (deputy === undefined) {
                        throw 'deputy not found ' + fullName;
                    }

                    m.submitters.push(deputy);
                }
            }

            this.logger.log('saving motion', m);
            await this.motionRepository.save(m);
        }
    }

    private parseDocNumbers(docs: string) {
        const documentNumbers = [];

        let match;
        while (match = this.docNumberRegex.exec(docs)) {
            documentNumbers.push(match[1]);
        }

        if (documentNumbers.length === 0) {
            return docs;
        }

        return documentNumbers.join(', '); 
    }

    async updateBills() {
        const response = await axios.get('https://titania.saeima.lv/LIVS13/saeimalivs13.nsf/webAll?OpenView&count=1500&start=1');
        const body = fixLatvianString(response.data);
        const motions = await this.motionRepository.find({ where: { type: 'Bill' }, relations: ['readings'] });
    
        let match;
        while (match = this.motionRegex.exec(body)) {
            const { lastStatus, title, number, uid } = match.groups;
            let motion = motions.find(m => m.uid === uid);
            
            if (motion && motion.isFinalized) {
                this.logger.log('skipping', title);
                continue;
            }
    
            const details = await this.getBillDetails(uid);
    
            if (motion === undefined) {
                motion = this.motionRepository.create({
                    type: 'Bill',
                    title: title,
                    number: number,
                    uid: uid,
                    referent: details.referent,
                    submittersText: details.submitters,
                    commission: details.commissionName,
                    submissionDate: convertDate(details.entries.find(x => x.status === 'Iesniegts').date),
                    docs: this.parseDocNumbers(details.entries.find(x => x.status.includes('Nod')).docs),
                });
            }
    
            const finalStatuses = [ 'Izsludināts', 'Noraidīts', 'Atsaukts' ];
    
            motion.isFinalized = details.entries.find(x => x.status === 'Izsludināts' || finalStatuses.includes(x.result)) !== undefined;
            if (motion.readings === undefined) {
                motion.readings = [];
            }
    
            const readingEntries = details.entries.filter(x => x.status.includes('lasījums') || x.status === 'Izsludināts' || x.status.includes('Nod'));
    
            for (const i in readingEntries) {
                const r = readingEntries[i];

                if (motion.readings[i] === undefined) {
                    motion.readings.push(this.readingRepository.create());
                }

                const reading = motion.readings[i];
                reading.motion = motion;
                reading.outcome = r.status === 'Izsludināts' ? r.status : r.result;
                reading.title = r.status;
                reading.docs = this.parseDocNumbers(r.docs);
                reading.date = r.date === '' ? null : convertDate(r.date);
            }
    
            try {
                this.logger.log('saving motion', motion);
                await this.motionRepository.save(motion);
            } catch (e) {
                this.logger.error(e);
            }
        }
        this.motionRegex.lastIndex = 0;
    }


    async updateInquires() {
        const response = await axios.get('https://titania.saeima.lv/LIVS13/saeimalivs_lmp.nsf/WEB_questions?OpenView&count=1000');
        const body = fixLatvianString(response.data);
        const motions = await this.motionRepository.find({ where: { type: 'Inquiry' }, relations: ['readings'] });
    
        let match;
        while (match = this.motionRegex.exec(body)) {
            const { lastStatus, title, number, uid } = match.groups;
    
            let motion = motions.find(m => m.uid === uid);
            
            if (motion && motion.isFinalized) {
                this.logger.log('skipping', title);
                continue;
            }
    
            const details = await this.getInquiryDetails(uid);
    
            if (motion === undefined) {
                motion = this.motionRepository.create({
                    type: 'Inquiry',
                    title: title,
                    number: number,
                    uid: uid,
                    submissionDate: convertDate(details.submissionDate),
                    docs: this.parseDocNumbers(details.docs),
                    referent: details.referent,
                    submittersText: details.submitters,
                });
            }
    
            motion.isFinalized = details.result !== '';
    
            if (details.readingDate) {
                const reading = motion.readings === undefined ? this.readingRepository.create() : motion.readings[0];
                reading.title = 'Saeimas sēde';
                reading.date = convertDate(details.readingDate);
                reading.outcome = details.result;
                reading.motion = motion;
    
                motion.readings = [reading];
            }
    
            this.logger.log('saving motion', motion);
            await this.motionRepository.save(motion);
        }
    }

    async updateRequests() {
        const response = await axios.get('https://titania.saeima.lv/LIVS13/saeimalivs_lmp.nsf/WEB_requests?OpenView&count=1000');
        const body = fixLatvianString(response.data);
        const motions = await this.motionRepository.find({ where: { type: 'Request' }, relations: ['readings'] });
    
        let match;
        while (match = this.motionRegex.exec(body)) {
            const { lastStatus, title, number, uid } = match.groups;
    
            let motion = motions.find(m => m.uid === uid);
            
            if (motion && motion.isFinalized) {
                this.logger.log('skipping', title);
                continue;
            }
    
            const details = await this.getRequestDetails(uid);
    
            if (motion === undefined) {
                motion = this.motionRepository.create({
                    type: 'Request',
                    title: title,
                    number: number,
                    uid: uid,
                    submissionDate: convertDate(details.submissionDate),
                    docs: this.parseDocNumbers(details.readings[0].docs),
                    referent: details.referent,
                    submittersText: details.submitters,
                    commission: details.comissionName,
                });
            }
    
            motion.isFinalized = details.readings.length > 1 && details.readings[1].result !== '';
    
            if (motion.readings === undefined) {
                motion.readings = [];
            }
    
            for (const i in details.readings) {
                const r = details.readings[i];
    
                if (motion.readings[i] === undefined) {
                    motion.readings.push(this.readingRepository.create());
                }
    
                const reading = motion.readings[i];
                reading.title = 'Saeimas sēde';
                reading.date = r.date === '' ? null : convertDate(r.date);
                reading.outcome = r.result;
                reading.docs = this.parseDocNumbers(r.docs);
                reading.motion = motion;
            }
    
            this.logger.log('saving motion', motion);
            await this.motionRepository.save(motion);
        }
    }

    async updateDecisions() {
        const response = await axios.get('https://titania.saeima.lv/LIVS13/saeimalivs_lmp.nsf/webAll?OpenView&count=1000&start=1');
        const body = fixLatvianString(response.data);
        const motions = await this.motionRepository.find({ where: { type: 'Decision' }, relations: ['readings'] });
    
        let match;
        while (match = this.motionRegex.exec(body)) {
            const { lastStatus, title, number, uid } = match.groups;
            let motion = motions.find(m => m.uid === uid);
    
            if (motion && motion.isFinalized) {
                this.logger.log('skipping', title);
                continue;
            }
    
            const details = await this.getDecisionDetails(uid);
    
            if (motion === undefined) {
                motion = this.motionRepository.create({
                    type: 'Decision',
                    title: title,
                    number: number,
                    uid: uid,
                    submissionDate: convertDate(details.submissionDate),
                    docs: this.parseDocNumbers(details.docs),
                    referent: details.referent,
                    submittersText: details.submitters,
                });
                
                const reading = this.readingRepository.create({
                    title: 'Iesniegšana',
                    docs: null,
                    date: convertDate(details.submissionDate),
                });
                
                motion.readings = [reading];
            }

            if (details.readingDate) {
                const reading = motion.readings.length < 2 ? this.readingRepository.create() : motion.readings[1];
                reading.title = 'Saeimas sēde';
                reading.docs = this.parseDocNumbers(details.publication);
                reading.date = convertDate(details.readingDate);
    
                motion.readings.push(reading);
            }
    
            motion.isFinalized = details.publication !== '';
    
            this.logger.log('saving', motion);
            await this.motionRepository.save(motion);
        }
    }

    private async getBillDetails(uid: string) {
        const url = 'https://titania.saeima.lv/livs13/saeimalivs13.nsf/0/' + uid;
        const response = await axios.get(url);
        const body = fixLatvianString(response.data);
    
        const submittersMatch = body.match(this.submitterRegex);
        const referentMatch = body.match(this.referentRegex);
        const commissionNameMatch = body.match(this.commissionNameRegex);
    
        const submitters = submittersMatch === null ? '' : submittersMatch[1];
        const referent = referentMatch === null ? '' : referentMatch[1];
        const commissionName = commissionNameMatch === null ? '' : commissionNameMatch[1];
    
        let match,
            entries: { status: string, date?: string, result?: string, docs?: string, deadline?: string }[];
    
        while (match = this.motionRowRegex.exec(body)) {
            const row = this.parseRow(match[0]);
            const title = row.shift();
    
            if (title === '') {
                entries = row.map(d => {
                    return { status: d };
                });
            } else if (title === 'Datums') {
                for (const i in row) {
                    entries[i].date = row[i];
                }
            } else if (title === 'Rezultāts') {
                for (const i in row) {
                    entries[i].result = row[i];
                }
            } else if (title === 'Dok. nr.') {
                for (const i in row) {
                    entries[i].docs = row[i];
                }
            } else if (title === 'Termiņš') {
                for (const i in row) {
                    entries[i].deadline = row[i];
                }
            }
        }
        this.motionRowRegex.lastIndex = 0;
    
        return { submitters: submitters, referent: referent, commissionName: commissionName, entries: entries };
    }

    private async getDecisionDetails(uid: string) {
        const url = 'https://titania.saeima.lv/livs13/saeimalivs_lmp.nsf/0/' + uid;
        this.logger.log(url);
        const response = await axios.get(url);
        const body = fixLatvianString(response.data);
    
        const match = body.match(this.motionInfoRowRegex);
        const row = this.parseRow(match[0]);
    
        const submittersMatch = body.match(this.submitterRegex);
        const referentMatch = body.match(this.referentRegex);
    
        const submitters = submittersMatch === null ? '' : submittersMatch[1];
        const referent = referentMatch === null ? '' : referentMatch[1];
    
        return { submitters: submitters, referent: referent, submissionDate: row[0], readingDate: row[1], docs: row[2], publication: row[3] };
    };

    //TODO: this is almost entirely same as the above function
    private async getInquiryDetails(uid: string) {
        const url = 'https://titania.saeima.lv/livs13/saeimalivs_lmp.nsf/0/' + uid;
        const response = await axios.get(url);
        const body = fixLatvianString(response.data);
        
        const match = body.match(this.motionInfoRowRegex);
        const row = this.parseRow(match[0]);
    
        const submittersMatch = body.match(this.submitterRegex);
        const referentMatch = body.match(this.altReferentRegex);
    
        const submitters = submittersMatch === null ? '' : submittersMatch[1];
        const referent = referentMatch === null ? '' : referentMatch[1];
    
        return { submitters: submitters, referent: referent, submissionDate: row[0], readingDate: row[1], docs: row[2], result: row[3] };
    };

    private async getRequestDetails(uid: string) {
        const url = 'https://titania.saeima.lv/livs13/saeimalivs_lmp.nsf/0/' + uid;
        const response = await axios.get(url);
        const body = fixLatvianString(response.data);
        
        let match = this.motionRowRegex.exec(body);
        const firstRow = this.parseRow(match[0]);
        match = this.motionRowRegex.exec(body);
        match = this.motionRowRegex.exec(body);
        const thirdRow = this.parseRow(match[0]);
        this.motionRowRegex.lastIndex = 0;
        const readings = [];
        const numberOfReadings = firstRow.length - 1;

        for (let i = 0; i < numberOfReadings; i++) {
            readings.push({
                date: thirdRow[(i * 3) + 1],
                docs: thirdRow[(i * 3) + 2],
                result: thirdRow[(i * 3) + 3],
            });
        }
    
        const submittersMatch = body.match(this.submitterRegex);
        const referentMatch = body.match(this.altReferentRegex);
        const commissionNameMatch = body.match(this.commissionNameRegex);
    
        const submitters = submittersMatch === null ? '' : submittersMatch[1];
        const referent = referentMatch === null ? '' : referentMatch[1];
        const commissionName = commissionNameMatch === null ? '' : commissionNameMatch[1];
    
        return { submitters: submitters, referent: referent, comissionName: commissionName, submissionDate: thirdRow[0], readings: readings };
    
    }

    private parseRow(row: string) {
        const data = [];
        let match;
    
        while (match = this.motionRowDataRegex.exec(row)) {
            data.push(match[1].replace(/&nbsp;/g, ' ').trim());
        }
        this.motionRowDataRegex.lastIndex = 0;
    
        return data;
    }
} 