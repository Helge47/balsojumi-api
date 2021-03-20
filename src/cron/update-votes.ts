import axios from 'axios';
import { createConnection } from 'typeorm';
import { Deputy, Vote, VoteType, Reading } from '../entities';
import { fixLatvianString } from './util';

const regex = /voteFullListByNames=\["(.*)"\];/gm;
const separator = '�';

const processReading = async (reading: Reading) => {
    if (reading.votes.length > 0) {
        console.log('already has votes, skipping', reading.id);
        return;
    }

    if (!reading.votingUid) {
        console.log('No voting on this reading, skipping', reading.id);
        return;
    }

    const url = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/0/' + reading.votingUid;
    const response = await axios.get(url);
    const page = response.data;

    const deputies: Deputy[] = await Deputy.find();
    const match = page.match(regex);

    if (match === null || match[1] === '') {
        console.log('The voting was anonymous, skipping');
    }

    const voteData = match[1].split('","');
    reading.votes = [];

    for (const i in voteData) {
        const [ orderNumber, name, partyName, voteType ] = voteData[i].split(separator);
        const fixedName = fixLatvianString(name);
        const fixedFaction = fixLatvianString(partyName);

        let deputy = deputies.find(d => d.surname + ' ' + d.name === fixedName);

        if (deputy === undefined) {
            console.warn('Deputy not found: ' + fixedName);
            continue;
        }

        if (deputy.currentFaction !== fixedFaction) {
            deputy.currentFaction = fixedFaction;
            console.log('new faction ', deputy);
            await deputy.save();
        }

        const vote = new Vote();
        vote.reading = reading;
        vote.deputy = deputy;
        vote.type = voteType as VoteType;

        reading.votes.push(vote);
    }

    await reading.save();

    console.log('reading votes saved', reading);
};

const processAll = async () => {
    await createConnection();
    const readings = await Reading.find({ relations: [ 'votes' ], take: 10 });

    for (const i in readings) {
        const reading = readings[i];
        console.log('Processing reading ' + reading.id);

        await processReading(reading);
    }

    console.log('All readings processed');

    process.exit();
};

processAll();