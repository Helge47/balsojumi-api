import { Deputy, DeputyRecord, Faction, Mandate } from "../entities";
import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository, IsNull } from "typeorm";
import { convertDate } from '../util/util';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { LoggingService } from "./logging-service";

@Service()
export class DeputyService {
    private archiveLinkRegex = /(Saeima.*.nsf)\/depArch/gm;
    private currentParliamentNumberRegex = /currentParlamentIndex="(.+)"/m;
    private archiveRecordRegex = [
        /depArchRec\({sname:"(?<surname>.+)",name:"(?<name>.+)",pk:"\(.+\)",unid:"(?<uid>.+)",sortid:".+",sid:"(?<sid>.+)",db:".+",langs:".+",pth:"(?<path>.*)"}\);/gm,
        /depArchRec\({sname:"(?<surname>.+)",name:"(?<name>.+)",pk:".+",sortid:".+",sid:"(?<sid>.+)",langs:".+",unid:"(?<uid>.+)",db:".+",sid:".+",sortid:".+",pth:"(?<path>.*)"}\);/gm
    ];

    private candidateListRegex = /<div><script>writeJsTrArr\("form_dep_list_vir","Ievēlēts no saraksta"\)<\/script>: (.*)<\/div>/m;
    private birthYearRegex = /<span>(.*)<script>writeJsTrArr\("form_birth_date_year","\. gadā"\)<\/script><\/span>/m;
    private residenceRegex = /<span  class="alt2"><script>writeJsTrArr\("form_living_place","Dzīvesvieta"\)<\/script>: <\/span><span>(.*)<\/span>/m;
    private emailRegex = /<a href="mailto:(.{1,50})">/gm;
    private mandateRegex = /drawMand\({sname:".*",name:".*",mfs:"(?<mfs>.*)",mfreason:"(?<mfreason>.*)",mrreason:"(?<mrreason>.*)",dtF:"(?<dtF>.*)",dtT:"(?<dtT>.*)",unid:".*"}\)/gm;

    constructor(
        @InjectRepository(Deputy) private readonly deputyRepository: Repository<Deputy>,
        @InjectRepository(DeputyRecord) private readonly deputyRecordRepository: Repository<DeputyRecord>,
        @InjectRepository(Mandate) private readonly mandateRepository: Repository<Mandate>,
        private readonly logger: LoggingService,
    ) {}

    async run() {
        this.logger.log('running DeputyService');
        await this.checkAllDeputiesPage();
        await this.updateDeputyRecordDetails();
        this.logger.log('DeputyService finished')
    }

    async checkAllDeputiesPage() {
        const response = await axios.get('https://titania.saeima.lv/Personal/Deputati/Saeima13_DepWeb_Public.nsf/farchivelist?readform&type=7&lang=LV&count=1000');
        const body = response.data;
    
        let match;
        while (match = this.archiveLinkRegex.exec(body)) {
            const deputyArchiveName = match[1];
            const archiveUrl = 'https://titania.saeima.lv/Personal/Deputati/' + deputyArchiveName + '/depArchList.js?OpenPage&count=3000&lang=LV';
            this.logger.log(archiveUrl);
            await this.scrapeArchive(archiveUrl);
    
            match = this.archiveLinkRegex.exec(body);
        }
        this.archiveLinkRegex.lastIndex = 0;
    }

    async updateDeputyRecordDetails() {
        const records = await this.deputyRecordRepository.find({ where: { deputyId: IsNull(), parliamentNumber: '13' }});

        for (const i in records) {
            const record = records[i];
    
            const url = 'https://titania.saeima.lv/Personal/Deputati/Saeima13_DepWeb_Public.nsf//0/' + record.uid + '?OpenDocument&lang=LV';
            const response = await axios.get(url);
            const body = response.data;
    
            const candidateListMatch = body.match(this.candidateListRegex);
            const candidateList = candidateListMatch ? candidateListMatch[1] : '';
            const birthYear = body.match(this.birthYearRegex)[1];
            const residence = body.match(this.residenceRegex)[1];
    
            let match;
            const emails: string[] = [];
            
            while (match = this.emailRegex.exec(body)) {
                emails.push(match[1]);
            }
    
            const dtfs: string[] = [];
            const mandates: Mandate[] = [];
    
            while (match = this.mandateRegex.exec(body)) {
                const { mfs, mrreason, mfreason, dtF, dtT } = match.groups;
                if (!dtfs.some(d => d === dtF)) {
                    dtfs.push(dtF);
                    this.logger.log(match.groups);
    
                    const mandate = this.mandateRepository.create({
                        reason: mrreason,
                        laidDownReason: mfreason === '' ? null : mfreason,
                        candidateList: candidateList
                    });
    
                    if (dtT === '') {
                        mandate.isActive = true;
                        mandate.laidDownDate = null;
                    } else {
                        mandate.laidDownDate = convertDate(dtT);
                        mandate.isActive = false;
                    }
    
                    if (dtF === '') {
                        mandate.date = convertDate(dtT);
                        mandate.isActive = false;
                    } else {
                        mandate.date = convertDate(dtF);
                    }
    
                    mandates.push(mandate);
                }
            }
    
            const deputy = this.deputyRepository.create({
                name: record.name,
                surname: record.surname,
                residence: residence,
                birthYear: birthYear,
                mandates: mandates,
                email: emails.length === 0 ? 'NAV' : emails[0],
                currentFaction: candidateList,
                records: [record],
            });
            
            try {
                await this.deputyRepository.save(deputy);
                this.logger.log(deputy);
                record.deputy = deputy;
                await this.deputyRecordRepository.save(record);
            } catch (e) {
                this.logger.error(e);
            }
        }
    }

    async downloadPictures() {
        const deputies = await this.deputyRepository.find({ relations: ['records'] });
        const basePath = path.resolve(__dirname, '..', '..', 'static', 'photo');
    
        for (const i in deputies) {
            const d = deputies[i];
            const record = d.records.find(r => r.parliamentNumber === '13');
            const url = 'https://titania.saeima.lv/personal/deputati/saeima13_depweb_public.nsf/0/' + record.uid + '/Foto/0.84?OpenElement&FieldElemFormat=jpg';
            const response = await axios.get(url, { responseType: 'stream' });
            const writeStream = fs.createWriteStream(path.resolve(basePath, d.id.toString() + '.jpg'));
            response.data.pipe(writeStream);
            writeStream.on('finish', () => this.logger.log('downloaded', d.surname));
        }
    }

    private async scrapeArchive(url: string) {
        const response = await axios.get(url);
        const body: string = response.data;
        this.logger.log(body);
        const numberMatch = body.match(this.currentParliamentNumberRegex);
        const parliamentNumber = numberMatch[1];
    
        let regex = this.archiveRecordRegex[0];
        let match = regex.exec(body);

        if (match === null) {
            regex.lastIndex = 0;
            regex = this.archiveRecordRegex[1];
            match = regex.exec(body); 
        }
    
        while (match !== null) {
            const { name, surname, uid, sid, path } = match.groups;
            const record = this.deputyRecordRepository.create({
                name: name,
                surname: surname,
                parliamentNumber: sid === 'C' ? parliamentNumber : sid,
                uid: uid,
                path: path,
            });

            try {
                this.logger.log('saving', record)
                await this.deputyRecordRepository.save(record);
            } catch (e) {
                this.logger.error(e);
            }

            match = regex.exec(body);
        }

        regex.lastIndex = 0;
    };
}