import axios from 'axios';
import { Deputy, DeputyRecord, Mandate } from '../entities';
import { createConnection, IsNull } from 'typeorm';
import { isNull } from 'util';

const archiveLinkRegex = /(Saeima.*.nsf)\/depArch/gm;
const currentParliamentNumberRegex = /currentParlamentIndex="(\.+)"/m;
const archiveRecordRegex = [
    /depArchRec\({sname:"(?<surname>.+)",name:"(?<name>.+)",pk:"\(.+\)",unid:"(?<uid>.+)",sortid:".+",sid:"(?<sid>.+)",db:".+",langs:".+",pth:"(?<path>.*)"}\);/gm,
    /depArchRec\({sname:"(?<surname>.+)",name:"(?<name>.+)",pk:".+",sortid:".+",sid:"(?<sid>.+)",langs:".+",unid:"(?<uid>.+)",db:".+",sid:".+",sortid:".+",pth:"(?<path>.*)"}\);/gm
];

const scrapeArchive = async (url: string) => {
    const response = await axios.get(url);
    const body: string = response.data;
    const numberMatch = body.match(currentParliamentNumberRegex);
    const parliamentNumber = numberMatch[1];

    let regex = archiveRecordRegex[0];
    let match = regex.exec(body);

    if (match === null) {
        regex = archiveRecordRegex[1];
        match = regex.exec(body); 
    }

    while (match !== null) {
        const { name, surname, uid, sid, path } = match.groups;
        const record = new DeputyRecord();
        record.name = name;
        record.surname = surname;
        record.parliamentNumber = sid === 'C' ? parliamentNumber : sid;
        record.uid = uid;
        record.path = path;

        await record.save();

        console.log(record);

        match = regex.exec(body);
    }
};

const checkAllDeputies = () => {
    axios.get('https://titania.saeima.lv/Personal/Deputati/Saeima13_DepWeb_Public.nsf/farchivelist?readform&type=7&lang=LV&count=1000')
        .then(async response => {
            await createConnection();
            const body = response.data;

            let match = archiveLinkRegex.exec(body);

            while (match !== null) {
                const deputyArchiveName = match[1];
                const archiveUrl = 'https://titania.saeima.lv/Personal/Deputati/' + deputyArchiveName + '/depArchList.js?OpenPage&count=3000&lang=LV';
                console.log(archiveUrl);
                await scrapeArchive(archiveUrl);
        
                match = archiveLinkRegex.exec(body);
            }
        });
};

const candidateListRegex = /<div><script>writeJsTrArr\("form_dep_list_vir","Ievēlēts no saraksta"\)<\/script>: (.*)<\/div>/m;
const birthYearRegex = /<span>(.*)<script>writeJsTrArr\("form_birth_date_year","\. gadā"\)<\/script><\/span>/m;
const residenceRegex = /<span  class="alt2"><script>writeJsTrArr\("form_living_place","Dzīvesvieta"\)<\/script>: <\/span><span>(.*)<\/span>/m;
const emailRegex = /<a href="mailto:(.{1,50})">/gm;
const mandateRegex = /drawMand\({sname:".*",name:".*",mfs:"(?<mfs>.*)",mfreason:"(?<mfreason>.*)",mrreason:"(?<mrreason>.*)",dtF:"(?<dtF>.*)",dtT:"(?<dtT>.*)",unid:".*"}\)/gm;

/* only for the 13th parliament */
const updateDeputyRecordDetails = async () => {
    const records = await DeputyRecord.find({ where: { deputyId: 0, parliamentNumber: '13' }});
    console.log(records);
    for (const i in records) {
        const record = records[i];

        const url = 'https://titania.saeima.lv/Personal/Deputati/Saeima13_DepWeb_Public.nsf//0/' + record.uid + '?OpenDocument&lang=LV';
        const pictureUrl = 'https://titania.saeima.lv/Personal/Deputati/Saeima13_DepWeb_Public.nsf/0/' + record.uid + '/Foto/0.84?OpenElement&amp;FieldElemFormat=jpg';
        const response = await axios.get(url);
        const body = response.data;

        const candidateListMatch = body.match(candidateListRegex);
        const candidateList = candidateListMatch ? candidateListMatch[1] : '';
        const birthYear = body.match(birthYearRegex)[1];
        const residence = body.match(residenceRegex)[1];

        let match;
        const emails: string[] = [];
        
        while (match = emailRegex.exec(body)) {
            emails.push(match[1]);
        }

        const dtfs: string[] = [];
        const mandates: Mandate[] = [];

        while (match = mandateRegex.exec(body)) {
            const { mfs, mrreason, mfreason, dtF, dtT } = match.groups;
            if (!dtfs.some(d => d === dtF)) {
                dtfs.push(dtF);
                console.log(match.groups);

                const mandate = new Mandate();
                mandate.reason = mrreason;
                mandate.laidDownReason = mfreason === '' ? null : mfreason;
                mandate.candidateList = candidateList;

                if (dtT === '') {
                    mandate.isActive = true;
                    mandate.laidDownDate = null;
                } else {
                    const [ date, month, year ] = dtT.split('.').map(x => parseInt(x));
                    mandate.laidDownDate = new Date(year, month - 1, date);
                    mandate.isActive = false;
                }

                if (dtF === '') {
                    const [ date, month, year ] = dtT.split('.').map(x => parseInt(x));
                    mandate.date = new Date(year, month - 1, date);
                    mandate.isActive = false;
                } else {
                    const [ date, month, year ] = dtF.split('.').map(x => parseInt(x));
                    mandate.date = new Date(year, month - 1, date);
                }

                await mandate.save();
                console.log(mandate);
                mandates.push(mandate);
            }
        }

        const deputy = new Deputy();
        deputy.name = record.name;
        deputy.surname = record.surname;
        deputy.residence = residence;
        deputy.birthYear = birthYear;
        deputy.mandates = mandates;
        deputy.email = emails.length === 0 ? 'NAV' : emails[0];
        deputy.currentFaction = candidateList;
        deputy.records = [record];

        await deputy.save();

        record.deputy = deputy;
        await record.save();
        console.log(deputy);
    }
}

const updateDeputiesFromRecords = async () => {
    const records = await DeputyRecord.find();

    for (const i in records) {
        const record = records[i];

    }
};


const main = async() => {
    await createConnection();
    await updateDeputyRecordDetails();
    process.exit(1);
}

main();