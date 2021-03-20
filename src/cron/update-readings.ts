import { Motion, Reading, Sitting } from '../entities';
import { createConnection } from 'typeorm';
import axios from 'axios';

const proposalRegex = /drawDKP_Pr\((".*?",){3}"(?<motionNumber>.*?)",".*?","(?<uid>.*?)".*?\)/gm;
const votingRegex = /addVotesLink\("(.*)","(.*)"(,".*"){3}\);/gm;

const processSitting = async (sitting: Sitting) => {
    const url = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/DK?ReadForm&nr=' + sitting.saeimaUid;
    const response = await axios.get(url);
    const page = response.data;

    const votings: { motionUid: string, uid: string }[] = [];
    let match;

    while (match = votingRegex.exec(page)) {
        const motionUid = match[1];
        const votingUid = match[2];

        if (!votings.some(v => v.motionUid === motionUid && v.uid === votingUid)) {
            votings.push({ motionUid: motionUid, uid: votingUid });
        }
    }
    votingRegex.lastIndex = 0;
    console.log('votings', votings);

    while (match = proposalRegex.exec(page)) {
        const { uid, motionNumber } = match.groups;

        const voting = votings.find(v => v.motionUid === uid);
        const motion = await Motion.findOne({ number: motionNumber }, { relations: ['readings'] });
        if (motion === undefined) {
            throw 'Motion ' + uid + ' not found in the database. Make sure you run all motion update scripts first.';
        }

        console.log(motion);

        const reading = motion.readings.find(m => m.date === sitting.date);
        reading.sitting = sitting;
        reading.votingUid = voting === undefined ? null : voting.uid;

        await reading.save();
        console.log('updated reading', reading);
    }
    proposalRegex.lastIndex = 0;
};

const processAll = async () => {
    await createConnection();
    const sittings = await Sitting.find({ take: 1, skip: 5 });

    for (const i in sittings) {
        const sitting = sittings[i];
        console.log('Processing sitting', sitting);
        try {
            await processSitting(sitting);
        } catch (e) {
            console.error(e);
        }
        console.log('Sitting processed');
    }

    console.log('All sittings processed');
    process.exit();
};

processAll();