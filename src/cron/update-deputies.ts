import axios from 'axios';
import { Deputy, Sitting, SittingType } from '../entities';
import { createConnection } from 'typeorm';

const archiveLinkRegex = /(Saeima.*.nsf)\/depArch/gm;
const currentParliamentNumberRegex = /currentParlamentIndex="(\d+)"/gm;
const archiveRecordRegex = [
    /depArchRec\({sname:"(?<surname>.+)",name:"(?<name>.+)",pk:"\(.+\)",unid:"(?<uid>.+)",sortid:".+",sid:"(?<sid>.+)",db:".+",langs:".+",pth:"(?<path>.*)"}\);/gm,
    /depArchRec\({sname:"(?<surname>.+)",name:"(?<name>.+)",pk:".+",sortid:".+",sid:"(?<sid>.+)",langs:".+",unid:"(?<uid>.+)",db:".+",sid:".+",sortid:".+",pth:"(?<path>.*)"}\);/gm
];

const scrapeArchive = async (url: string) => {
    const response = await axios.get(url);
    const body: string = response.data;
    const numberMatch = currentParliamentNumberRegex.exec(body);
    const parliamentNumber = numberMatch[1];
    currentParliamentNumberRegex.lastIndex = 0;

    let regex = archiveRecordRegex[0];
    let match = regex.exec(body);

    if (match === null) {
        regex = archiveRecordRegex[1];
        match = regex.exec(body); 
    }

    while (match !== null) {
        const { name, surname, uid, sid, path } = match.groups;

        console.log({ parliamentNumber, name, surname, uid, sid, path });

        match = regex.exec(body);
    }
};

axios.get('https://titania.saeima.lv/Personal/Deputati/Saeima13_DepWeb_Public.nsf/farchivelist?readform&type=7&lang=LV&count=1000')
    .then(async response => {
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