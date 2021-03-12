import request from 'request';
import { Sitting, Proposal } from '../entities';
import { createConnection } from 'typeorm';
import { fixLatvianString } from './util';

const proposalRegex = /drawDKP_Pr\("(.*)"\)/gm;
const votingRegex = /addVotesLink\("(.*)","(.*)"(,".*"){3}\);/gm;

const processSitting = (sitting: Sitting) => {
    return new Promise<void>((resolve) => {
        if (sitting.isScraped) {
            return resolve();
        }

        const url = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/DK?ReadForm&nr=' + sitting.saeimaUid;
        console.log(url);

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

            console.log(votings);

            const proposalUids: string[] = sitting.proposals.map(p => p.saeimaUid);
    
            match = proposalRegex.exec(page);
    
            while (match !== null) {
                const dataArray = match[1].split('","');
                const uid = dataArray[5];
    
                if (!proposalUids.some(u => u === uid)) {
                    const proposal = new Proposal();
                    proposal.title = fixLatvianString(dataArray[2]);
                    proposal.saeimaUid = uid;
                    proposal.lawProjectNumber = dataArray[3] ? fixLatvianString(dataArray[3]) : null;
                    proposal.commission = dataArray[6] ? fixLatvianString(dataArray[6]) : null;
                    proposal.outcome = fixLatvianString(dataArray[8]);
    
                    const voting = votings.find(v => v.proposalUid === uid);
                    proposal.votingUid = voting ? voting.uid : null;
                    
                    console.log('saving a proposal', proposal);
                    await proposal.save();
                    sitting.proposals.push(proposal);
                }
    
                match = proposalRegex.exec(page);
            }

            sitting.isScraped = true;
            await sitting.save();
    
            return resolve();
        });
    });
};

const processAll = async () => {
    await createConnection();
    const sittings = await Sitting.find({ take: 5, relations: ['proposals'], where: { isScraped: false } });

    for (const i in sittings) {
        const sitting = sittings[i];
        console.log('Processing sitting ' + sitting.id);

        await processSitting(sitting);

        console.log('Sitting processed');
    }

    console.log('All sittings processed');
    process.exit();
};

processAll();