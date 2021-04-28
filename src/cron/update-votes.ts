import axios from 'axios';
import { createConnection } from 'typeorm';
import { Deputy, Vote, VoteType, Voting } from '../entities';
import { fixLatvianString } from './util';

const regex = /voteFullListByNames=\["(.*)"\];/gm;
const separator = '�';

const processVoting = async (voting: Voting) => {
    if (voting.votes.length > 0) {
        console.log('already has votes, skipping', voting.id);
        return;
    }

    const url = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/0/' + voting.uid;
    const response = await axios.get(url);
    const page = response.data;
    console.log(page);

    const deputies: Deputy[] = await Deputy.find();
    const match = regex.exec(page);
    regex.lastIndex = 0;
    console.log(match);

    if (match === null || match[1] === '') {
        console.log('The voting was anonymous, skipping');
        return;
    }

    const voteData = match[1].split('","');
    voting.votes = [];

    for (const i in voteData) {
        const [ orderNumber, name, partyName, voteType ] = voteData[i].split(separator);
        const fixedName = fixLatvianString(name);
        const fixedFaction = fixLatvianString(partyName);

        const deputy = deputies.find(d => {
            return fixedName.includes(d.surname) && fixedName.includes(d.name);
            return d.surname + ' ' + d.name === fixedName || 
                d.surname.split('-')[0] + ' ' + d.name === fixedName;
        });

        if (deputy === undefined) {
            console.error('Deputy not found: ' + fixedName);
            process.exit();
        }

        if (deputy.currentFaction !== fixedFaction) {
            deputy.currentFaction = fixedFaction;
            console.log('new faction ', deputy);
            await deputy.save();
        }

        const vote = new Vote();
        vote.voting = voting;;
        vote.deputy = deputy;
        vote.type = voteType as VoteType;

        voting.votes.push(vote);
    }

    await voting.save();
    console.log('votes saved', voting);
};

const processAll = async () => {
    await createConnection();
    const votings = await Voting.find({ where: { method: 'default' }, relations: [ 'votes' ] });

    for (const i in votings) {
        const voting = votings[i];
        console.log('Processing voting ' + voting.id);

        await processVoting(voting);
    }

    console.log('All votings processed');
    process.exit();
};

processAll();