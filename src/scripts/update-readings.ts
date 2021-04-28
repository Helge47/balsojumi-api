import { Motion, Sitting } from '../entities';
import { createConnection } from 'typeorm';
import axios from 'axios';
import Voting from '../entities/Voting';

const proposalRegex = /drawDKP_Pr\((".*?",){3}"(?<motionNumber>.*?)",".*?","(?<uid>.*?)".*?\)/gm;
const votingRegex = /addVotesLink\("(.*)","(.*)"(,".*"){3}\);/gm;

const processSitting = async (sitting: Sitting) => {
    const url = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/DK?ReadForm&nr=' + sitting.saeimaUid;
    const response = await axios.get(url);
    const page = response.data;

    const votingUids: { motionUid: string, uid: string }[] = [];
    let match;

    while (match = votingRegex.exec(page)) {
        const motionUid = match[1];
        const votingUid = match[2];

        if (!votingUids.some(v => v.motionUid === motionUid && v.uid === votingUid)) {
            votingUids.push({ motionUid: motionUid, uid: votingUid });
        }
    }
    votingRegex.lastIndex = 0;
    console.log('votings', votingUids);

    while (match = proposalRegex.exec(page)) {
        const { uid, motionNumber } = match.groups;

        if (!motionNumber || motionNumber === '26/Lp13') {
            console.log('No motion');
            continue;
        }

        const motion = await Motion.findOne({ number: motionNumber }, { relations: ['readings', 'readings.motion'] });
        if (motion === undefined) {
            throw 'Motion ' + motionNumber + ' not found in the database. Make sure you run all motion update scripts first.';
        }

        if (sitting.readings.some(r => {
            console.log(r.motion, r.id);
            return r.motion.uid === motion.uid;
        })) {
            console.log('Sitting already has reading for this motion');
            continue;
        }

        const reading = motion.readings.find(m => m.date === sitting.date);
        if (reading === undefined) {
            console.warn('no such reading for this motion ' + sitting.date + ' ' + motion.id);
            continue;
        }

        reading.sitting = sitting;
        reading.votings = [];
        const votingUid = votingUids.find(v => v.motionUid === uid);
        if (votingUid !== undefined) {
            const voting = new Voting();
            voting.uid = votingUid.uid;
            voting.method = 'default';
            voting.type = 'primary';
            voting.reading = reading;

            reading.votings.push(voting);
        }

        //TODO: Parse secondary votings

        await reading.save();
        sitting.readings.push(reading);

        console.log('reading updated', reading);
    }
    proposalRegex.lastIndex = 0;

    await sitting.save();
};

const processAll = async () => {
    await createConnection();
    const sittings = await Sitting.find({ order: { id: 'ASC' }, relations: [ 'readings', 'readings.motion' ] });

    for (const i in sittings) {
        const sitting = sittings[i];

        if (sitting.readings.length > 0) {
            console.log('sitting already has readings in it, skipping', sitting.id);
        } else {
            console.log('Processing sitting', sitting);
            await processSitting(sitting);
            console.log('Sitting processed');
        }
    }

    console.log('All sittings processed');
    process.exit();
};

processAll();