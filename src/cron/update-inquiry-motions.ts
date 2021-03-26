import { createConnection } from "typeorm";
import axios from "axios";
import { fixLatvianString } from "./util";
import { Motion, Reading } from "../entities";

const motionRegex = /dvRow_LPView\("(?<lastStatus>.*)","(?<title>.*)","(?<number>.*)","(?<uid>.*)","(.*)"\);/gm;
const inquiryRowRegex = /<tr class="infoRowCT">(\n.*)+?\n<\/tr>/gm;
const decisionRowDataRegex = /\s*?<td.*?>(.+?)<\/td>/gm;

const submitterRegex = /Iesniedzēj.: <\/font>(.+?)<\/div>/;
const referentRegex = /Adresāt.: <\/font>(.*?)</;

const parseRow = (row: string) => {
    const data = [];
    let match;

    while (match = decisionRowDataRegex.exec(row)) {
        data.push(match[1].replace(/&nbsp;/g, ' ').trim());
    }

    decisionRowDataRegex.lastIndex = 0;

    return data;
};

const getInquiryDetails = async (uid: string) => {
    const url = 'https://titania.saeima.lv/livs13/saeimalivs_lmp.nsf/0/' + uid;
    const response = await axios.get(url);
    const body = fixLatvianString(response.data);
    
    let match = inquiryRowRegex.exec(body);
    inquiryRowRegex.lastIndex = 0;
    const row = parseRow(match[0]);

    const submittersMatch = body.match(submitterRegex);
    const referentMatch = body.match(referentRegex);

    const submitters = submittersMatch === null ? '' : submittersMatch[1];
    const referent = referentMatch === null ? '' : referentMatch[1];

    return { submitters: submitters, referent: referent, submissionDate: row[0], readingDate: row[1], docs: row[2], result: row[3] };
};

const checkAllInquiryPage = async () => {
    const response = await axios.get('https://titania.saeima.lv/LIVS13/saeimalivs_lmp.nsf/WEB_questions?OpenView&count=2&start=30');
    const body = fixLatvianString(response.data);
    const uids = (await Motion.find({ where: { type: 'Inquiry' }})).map(m => m.uid);

    let match;
    while (match = motionRegex.exec(body)) {
        const { lastStatus, title, number, uid } = match.groups;

        if (uids.includes(uid)) {
            console.log('skipping', number, title);
            continue;
        }

        const details = await getInquiryDetails(uid);

        const motion = new Motion();
        motion.type = 'Inquiry';
        motion.title = title; 
        motion.number = number;
        motion.uid = uid;
        motion.submissionDate = details.submissionDate;
        motion.docs = details.docs;
        motion.referent = details.referent;
        motion.submitters = details.submitters;

        if (details.readingDate) {
            const reading = new Reading();
            reading.title = 'Saeimas sēde';
            reading.date = details.readingDate;
            reading.outcome = details.result;
            reading.motion = motion;

            motion.readings = [reading];
        }

        await motion.save();
        console.log('saved motion', motion);
    }
};


const main = async () => {
    await createConnection();
    await checkAllInquiryPage();
    process.exit();
};

main();