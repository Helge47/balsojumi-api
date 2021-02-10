import request from 'request';
import fs from 'fs';
import { Meeting, MeetingType } from '../entities';
import { createConnection } from 'typeorm';

const regex = /dCC\("(\d*)","(\d{4})","(\d{1,2})","(\d{1,2})","(\d{1,2})","(\d{1,2})","(.*)"\)/gm;

//request('https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/DK?ReadForm&calendar=1', (error, response, body) => {
fs.readFile(__dirname + '/../../calendar.html', async (error, data) => {
    const page = data.toString();

    await createConnection();
    const allMeetings = await Meeting.find();
    const uids: string[] = allMeetings.map(m => m.saeimaUid);
    let match = regex.exec(page);

    while (match !== null) {
        const uid = match[7];

        if (!uids.some(u => u === uid)) {
            uids.push(uid);

            const year = parseInt(match[2]);
            const month = parseInt(match[3]);
            const day = parseInt(match[4]);
            const date = new Date(year, month - 1, day);

            const modifier = parseInt(match[5]);
            let type = MeetingType.DEFAULT;

            if (modifier === 2) {
                type = MeetingType.EMERGENCY;
            } else if (modifier === 3) {
                type = MeetingType.FORMAL;
            } else if (modifier === 4) {
                type = MeetingType.CLOSED;
            } else if (modifier === 5) {
                type = MeetingType.QA;
            } else if (modifier === 6) {
                type = MeetingType.EMERGENCY_SESSION;
            }

            const meeting = new Meeting();
            meeting.date = date;
            meeting.saeimaUid = uid;
            meeting.type = type;

            await meeting.save();
        }

        match = regex.exec(page);
    }

    console.log('All meetings updated');
    process.exit();
});
