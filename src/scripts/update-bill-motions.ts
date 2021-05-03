import axios from "axios";
import { Reading, Motion } from "../entities";
import { createConnection } from "typeorm";
import { convertDate } from "./util";

const billRegex = /dvRow_LPView\("(?<lastStatus>.*)","(?<title>.*)","(?<number>.*)","(?<uid>.*)","(.*)"\);/gm;
const billRowRegex = /<tr class=".+?">(\n.*)+?\n<\/tr>/gm;
const billRowDataRegex = /\s*?<td.*?>(.+?)<\/td>/gm;

const submitterRegex = /Iesniedzēj.: <\/font>(.+?)<\/div>/;
const referentRegex = /Referent.: <\/font>(.*?)&/;
const commissionNameRegex = /komisija:\s+<div.+?>(.*?)<\/div>/;

//WIP
const getCommissionDetails = async (commissionName: string, billNumber: string) => {
    const url = 'https://titania.saeima.lv/LIVS13/saeimalivs13.nsf/WEBAllKA?OpenView=&count=1000&RestrictToCategory=6/'
         + billNumber + '|'
         + encodeURIComponent(commissionName);
    
    console.log(url);

    const response = await axios.get(url);
    const body = response.data;

    console.log(body);
};

const parseRow = (row: string) => {
    const data = [];
    let match;

    while (match = billRowDataRegex.exec(row)) {
        data.push(match[1].replace(/&nbsp;/g, ' ').trim());
    }
    billRowDataRegex.lastIndex = 0;

    return data;
};

const getBillDetails = async (uid: string) => {
    const url = 'https://titania.saeima.lv/livs13/saeimalivs13.nsf/0/' + uid;
    const response = await axios.get(url);
    const body = response.data;

    const submittersMatch = body.match(submitterRegex);
    const referentMatch = body.match(referentRegex);
    const commissionNameMatch = body.match(commissionNameRegex);

    const submitters = submittersMatch === null ? '' : submittersMatch[1];
    const referent = referentMatch === null ? '' : referentMatch[1];
    const commissionName = commissionNameMatch === null ? '' : commissionNameMatch[1];

    let match,
        entries: { status: string, date?: string, result?: string, docs?: string, deadline?: string }[];

    while (match = billRowRegex.exec(body)) {
        const row = parseRow(match[0]);
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
    billRowRegex.lastIndex = 0;

    return { submitters: submitters, referent: referent, commissionName: commissionName, entries: entries };
};

const checkAllBillsPage = async () => {
    const response = await axios.get('https://titania.saeima.lv/LIVS13/saeimalivs13.nsf/webAll?OpenView&count=1500&start=1');
    const body = response.data;
    const motions = await Motion.find({ where: { type: 'Bill' }, relations: ['readings'] });

    let match;
    while (match = billRegex.exec(body)) {
        const { lastStatus, title, number, uid } = match.groups;
        let motion = motions.find(m => m.uid === uid);
        
        if (motion && motion.isFinalized) {
            console.log('skipping', title);
            continue;
        }

        const details = await getBillDetails(uid);

        if (motion === undefined) {
            motion = new Motion();
            motion.type = 'Bill';
            motion.title = title;
            motion.number = number;
            motion.uid = uid;
            motion.referent = details.referent;
            motion.submittersText = details.submitters;
            motion.commission = details.commissionName;
            motion.submissionDate = convertDate(details.entries.find(x => x.status === 'Iesniegts').date);
            motion.docs = details.entries.find(x => x.status.includes('Nod')).docs;
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
                motion.readings.push(new Reading());
            }

            const reading = motion.readings[i];
            reading.motion = motion;
            reading.outcome = r.status === 'Izsludināts' ? r.status : r.result;
            reading.title = r.status;
            reading.docs = r.docs;
            reading.date = r.date === '' ? null : convertDate(r.date);
        }

        try {
            console.log('saving motion', motion);
            await motion.save();
        } catch (e) {
            console.error(e);
        }
    }
    billRegex.lastIndex = 0;
};

const main = async () => {
    await createConnection();
    await checkAllBillsPage();
    process.exit();
};

main();
