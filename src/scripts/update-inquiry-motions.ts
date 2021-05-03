import { createConnection } from "typeorm";
import axios from "axios";
import { fixLatvianString, convertDate } from "./util";
import { Motion, Reading } from "../entities";

const motionRegex = /dvRow_LPView\("(?<lastStatus>.*)","(?<title>.*)","(?<number>.*)","(?<uid>.*)","(.*)"\);/gm;
const inquiryRowRegex = /<tr class="infoRowCT">(\n.*)+?\n<\/tr>/gm;
const decisionRowDataRegex = /\s*?<td.*?>(.*?)<\/td>/gm;

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
    const response = await axios.get('https://titania.saeima.lv/LIVS13/saeimalivs_lmp.nsf/WEB_questions?OpenView&count=1000');
    const body = fixLatvianString(response.data);
    const motions = await Motion.find({ where: { type: 'Inquiry' }, relations: ['readings'] });

    let match;
    while (match = motionRegex.exec(body)) {
        const { lastStatus, title, number, uid } = match.groups;

        let motion = motions.find(m => m.uid === uid);
        
        if (motion && motion.isFinalized) {
            console.log('skipping', title);
            continue;
        }

        const details = await getInquiryDetails(uid);

        if (motion === undefined) {
            motion = new Motion();
            motion.type = 'Inquiry';
            motion.title = title; 
            motion.number = number;
            motion.uid = uid;
            motion.submissionDate = convertDate(details.submissionDate);
            motion.docs = details.docs;
            motion.referent = details.referent;
            motion.submittersText = details.submitters;
        }

        motion.isFinalized = details.result !== '';

        if (details.readingDate) {
            const reading = motion.readings === undefined ? new Reading() : motion.readings[0];
            reading.title = 'Saeimas sēde';
            reading.date = convertDate(details.readingDate);
            reading.outcome = details.result;
            reading.motion = motion;

            motion.readings = [reading];
        }

        console.log('saving motion', motion);
        await motion.save();
    }
};


const main = async () => {
    await createConnection();
    await checkAllInquiryPage();
    process.exit();
};

main();