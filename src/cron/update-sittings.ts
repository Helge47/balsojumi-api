import request from 'request';
import fs from 'fs';
import { Sitting, SittingType } from '../entities';
import { createConnection } from 'typeorm';

const regex = /dCC\("(\d*)","(\d{4})","(\d{1,2})","(\d{1,2})","(\d{1,2})","(\d{1,2})","(.*)"\)/gm;

request('https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/DK?ReadForm&calendar=1', async (error, response, body) => {
    const page = body;

    await createConnection();
    const allSittings = await Sitting.find();
    const uids: string[] = allSittings.map(s => s.saeimaUid);
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
            let type = SittingType.DEFAULT;

            if (modifier === 2) {
                type = SittingType.EMERGENCY;
            } else if (modifier === 3) {
                type = SittingType.FORMAL;
            } else if (modifier === 4) {
                type = SittingType.CLOSED;
            } else if (modifier === 5) {
                type = SittingType.QA;
            } else if (modifier === 6) {
                type = SittingType.EMERGENCY_SESSION;
            }

            const sitting = new Sitting();
            sitting.date = date;
            sitting.saeimaUid = uid;
            sitting.type = type;

            await sitting.save();
        }

        match = regex.exec(page);
    }

    console.log('All sittings updated');
    process.exit();
});
