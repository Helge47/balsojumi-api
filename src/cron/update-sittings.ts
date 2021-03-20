
import { Sitting, SittingType } from '../entities';
import { createConnection } from 'typeorm';
import axios from 'axios';

const regex = /dCC\("(\d*)","(\d{4})","(\d{1,2})","(\d{1,2})","(\d{1,2})","(\d{1,2})","(.*)"\)/gm;

const checkSittingsPage = async () => {
    const response = await axios.get('https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/DK?ReadForm&calendar=1');
    const page = response.data;
    
    const uids: string[] = (await Sitting.find()).map(s => s.saeimaUid);
    let match;
    const sittings: Sitting[] = [];

    while (match = regex.exec(page)) {
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

            sittings.push(sitting);
        }

    }
    regex.lastIndex = 0;

    sittings.sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const i in sittings) {
        await sittings[i].save();
        console.log('sitting saved', sittings[i]);
    }
    
    console.log('All sittings updated');
    process.exit();
};

const main = async () => {
    await createConnection();
    await checkSittingsPage();
    process.exit();
};

main();
