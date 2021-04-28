import { createConnection } from "typeorm";
import axios from "axios";
import { convertDate, fixLatvianString } from "./util";
import { Motion, Reading } from "../entities";

const motionRegex = /dvRow_LPView\("(?<lastStatus>.*)","(?<title>.*)","(?<number>.*)","(?<uid>.*)","(.*)"\);/gm;
const decisionRowRegex = /<tr class=".+?">(\n.*)+?\n<\/tr>/gm;
const decisionRowDataRegex = /\s*?<td.*?>(.+?)<\/td>/gm;

const submitterRegex = /Iesniedzēj.: <\/font>(.+?)<\/div>/;
const referentRegex = /Adresāt.: <\/font>(.*?)</;
const commissionNameRegex = /komisija:\s+<div.+?>(.*?)<\/div>/;

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
    
    let match = decisionRowRegex.exec(body);
    const firstRow = parseRow(match[0]);
    match = decisionRowRegex.exec(body);
    match = decisionRowRegex.exec(body);
    const thirdRow = parseRow(match[0]);
    decisionRowRegex.lastIndex = 0;
    const readings = [{ date: thirdRow[1], docs: thirdRow[2], result: thirdRow[3] }];
    
    //means there are 2 readings listed
    if (firstRow.length > 2) {
        readings.push({
            date: thirdRow[4],
            docs: thirdRow[5],
            result: thirdRow[6]
        });
    }

    const submittersMatch = body.match(submitterRegex);
    const referentMatch = body.match(referentRegex);
    const commissionNameMatch = body.match(commissionNameRegex);

    const submitters = submittersMatch === null ? '' : submittersMatch[1];
    const referent = referentMatch === null ? '' : referentMatch[1];
    const commissionName = commissionNameMatch === null ? '' : commissionNameMatch[1];

    return { submitters: submitters, referent: referent, comissionName: commissionName, submissionDate: thirdRow[0], readings: readings };
};

const checkAllRequestsPage = async () => {
    const response = await axios.get('https://titania.saeima.lv/LIVS13/saeimalivs_lmp.nsf/WEB_requests?OpenView&count=1000');
    const body = fixLatvianString(response.data);
    const motions = await Motion.find({ where: { type: 'Request' }, relations: ['readings'] });

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
            motion.type = 'Request';
            motion.title = title;
            motion.number = number;
            motion.uid = uid;
            motion.submissionDate = convertDate(details.submissionDate);
            motion.docs = details.readings[0].docs;
            motion.referent = details.referent;
            motion.submitters = details.submitters;
            motion.commission = details.comissionName;
        }

        motion.isFinalized = details.readings.length > 1 && details.readings[1].result !== '';

        if (motion.readings === undefined) {
            motion.readings = [];
        }

        for (const i in details.readings) {
            const r = details.readings[i];

            if (motion.readings[i] === undefined) {
                motion.readings.push(new Reading());
            }

            const reading = motion.readings[i];
            reading.title = 'Saeimas sēde';
            reading.date = r.date === '' ? null : convertDate(r.date);
            reading.outcome = r.result;
            reading.docs = r.docs;
            reading.motion = motion;
        }

        console.log('saving motion', motion);
        await motion.save();
    }
};


const main = async () => {
    await createConnection();
    await checkAllRequestsPage();
    process.exit();
};

main();