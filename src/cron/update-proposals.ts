import request from 'request';
import fs from 'fs';
import { Meeting, Proposal } from '../entities';
import { createConnection } from 'typeorm';

const proposalRegex = /drawDKP_Pr\("(.*)"\)/gm;
const votingRegex = /addVotesLink\("(.*)","(.*)"(,"\d"){3}\);/gm

const processMeeting = (meeting: Meeting) => {
    return new Promise<void>((resolve) => {
        if (meeting.isScraped) {
            return resolve();
        }

        const url = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/DK?ReadForm&nr=' + meeting.saeimaUid;

        request(url, async (error, response, body) => {
            const page = body as string;
    
            let match = votingRegex.exec(page);
            const votings: { proposalUid: string, uid: string }[] = [];
    
            while (match !== null) {
                const proposalUid = match[1];
                const votingUid = match[2];
    
                if (!votings.some(v => v.proposalUid === proposalUid && v.uid === votingUid)) {
                    votings.push({ proposalUid: proposalUid, uid: votingUid });
                }
    
                match = votingRegex.exec(page);
            }
    
            const proposalUids: string[] = meeting.proposals.map(p => p.saeimaUid);
    
            match = proposalRegex.exec(page);
    
            while (match !== null) {
                const dataArray = match[1].split('","');
                const uid = dataArray[5];
    
                if (!proposalUids.some(u => u === uid)) {
                    const proposal = new Proposal();
                    proposal.title = dataArray[2];
                    proposal.meeting = meeting;
                    proposal.saeimaUid = uid;
                    proposal.lawProjectNumber = dataArray[3] || null;
                    proposal.commission = dataArray[7] || null;
                    proposal.outcome = dataArray[8];
    
                    const voting = votings.find(v => v.proposalUid === uid);
                    proposal.votingUid = voting ? voting.uid : null;
                    
                    console.log('saving a proposal');
                    await proposal.save();
                }
    
                match = proposalRegex.exec(page);
            }

            meeting.isScraped = true;
            await meeting.save();
    
            return resolve();
        });
    });
};

const processAll = async () => {
    await createConnection();
    const meetings = await Meeting.find({ take: 10, relations: ['proposals'], where: { isScraped: false } });

    for (const i in meetings) {
        const meeting = meetings[i];
        console.log('Processing meeting ' + meeting.id);

        await processMeeting(meeting);

        console.log('Meeting processed');
    }

    console.log('All meetings processed');
    process.exit();
};

processAll();