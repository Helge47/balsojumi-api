import { createConnection } from "typeorm";
import axios from "axios";
import { convertDate, fixLatvianString } from "./util";
import { Motion, Reading } from "../entities";

const motionRegex = /dvRow_LPView\("(?<lastStatus>.*)","(?<title>.*)","(?<number>.*)","(?<uid>.*)","(.*)"\);/gm;
const decisionRowRegex = /<tr class="infoRowCT">(\n.*)+?\n<\/tr>/gm;
const decisionRowDataRegex = /\s*?<td.*?>(.+?)<\/td>/gm;

const submitterRegex = /Iesniedzēj.: <\/font>(.+?)<\/div>/;
const referentRegex = /Referent.: <\/font>(.*?)</;

const parseRow = (row: string) => {
    const data = [];
    let match;

    while (match = decisionRowDataRegex.exec(row)) {
        data.push(match[1].replace(/&nbsp;/g, ' ').trim());
    }

    decisionRowDataRegex.lastIndex = 0;

    return data;
};

const getDecisionDetails = async (uid: string) => {
    const url = 'https://titania.saeima.lv/livs13/saeimalivs_lmp.nsf/0/' + uid;
    const response = await axios.get(url);
    const body = fixLatvianString(response.data);

    const match = body.match(decisionRowRegex);
    const row = parseRow(match[0]);

    const submittersMatch = body.match(submitterRegex);
    const referentMatch = body.match(referentRegex);

    const submitters = submittersMatch === null ? '' : submittersMatch[1];
    const referent = referentMatch === null ? '' : referentMatch[1];

    return { submitters: submitters, referent: referent, submissionDate: row[0], readingDate: row[1], docs: row[2], publication: row[3] };
};

const checkAllDecisionsPage = async () => {
    const response = await axios.get('https://titania.saeima.lv/LIVS13/saeimalivs_lmp.nsf/webAll?OpenView&Count=2&start=24');
    const body = fixLatvianString(response.data);
    const uids = (await Motion.find({ where: { type: 'Decision' }})).map(m => m.uid);

    let match;
    while (match = motionRegex.exec(body)) {
        const { lastStatus, title, number, uid } = match.groups;

        if (uids.includes(uid)) {
            console.log('skipping', title);
            continue;
        }

        const details = await getDecisionDetails(uid);

        const motion = new Motion();
        motion.type = 'Decision';
        motion.title = title;
        motion.number = number;
        motion.uid = uid;
        motion.submissionDate = convertDate(details.submissionDate);
        motion.docs = details.docs;
        motion.referent = details.referent;
        motion.submitters = details.submitters;

        if (details.readingDate) {
            const reading = new Reading();
            reading.title = 'Saeimas sēde';
            reading.docs = details.publication;
            reading.motion = motion;
            reading.date = convertDate(details.readingDate);

            motion.readings = [ reading ];
        }

        await motion.save();
        console.log('saved motion', motion);
    }
};


const main = async () => {
    await createConnection();
    await checkAllDecisionsPage();
    process.exit();
};

main();