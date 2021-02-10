import { log } from 'console';
import request from 'request';
import { createConnection } from 'typeorm';
import { Deputy, Party, Vote, VoteType, Proposal } from '../entities';

const regex = /voteFullListByNames=\["(.*)"\];/gm;
const separator = '�';

const processProposal = async (proposal?: Proposal): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (proposal.isScraped) {
            console.log('Is already scraped, skipping')
            return resolve();
        }

        if (proposal.votingUid === undefined) {
            console.log('No voting for this proposal, skipping')
            proposal.isScraped = true;
            return proposal.save()
                .then(() => resolve())
                .catch(reject);
        }

        const url = 'https://titania.saeima.lv/LIVS13/SaeimaLIVS2_DK.nsf/0/' + proposal.votingUid + '?OpenDocument';

        request(url, async (error, response, body) => {
            const page = body as string;

            const deputies: Deputy[] = await Deputy.find();

            let match = regex.exec(page);

            if (match === null || match[1] === '') {
                console.log('The voting was anonymous, setting flag and skipping');
                proposal.isAnonymous = true;
                await proposal.save();
                return resolve();
            }

            const voteData = match[1].split('","');

            for (const i in voteData) {
                const [ orderNumber, name, partyName, voteType ] = voteData[i].split(separator);

                let deputy = deputies.find(d => d.name === name);

                if (deputy === undefined) {
                    console.log('New deputy found: ' + name);
                    deputy = new Deputy();
                    deputy.name = name;
                    deputy.party = partyName as Party;
    
                    await deputy.save();
                }

                const vote = new Vote();
                vote.proposal = proposal;
                vote.deputy = deputy;
                vote.type = voteType as VoteType;

                await vote.save();
            }

            proposal.isScraped = true;
            await proposal.save();

            console.log('proposal votes saved');

            resolve();
        });
    });
};

const processAll = async () => {
    await createConnection();
    const proposals = await Proposal.find({ take: 10, where: { isScraped: false, isAnonymous: false } });

    for (const i in proposals) {
        const proposal = proposals[i];
        console.log('Processing proposal ' + proposal.id);

        await processProposal(proposal);
    }

    console.log('All proposals processed');

    process.exit();
};

processAll();