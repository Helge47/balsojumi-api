import { Deputy, Voting } from "../entities";
import { createConnection } from "typeorm";
import { uniqBy } from "lodash";
import { inspect } from "util";

type VotingStats = { deputyId: number, others: { deputyId: number, same: number, opposite: number }[] }[];

const calculateAttendanceStats = async () => {
    const deputy = (await Deputy.find({ take: 1, relations: [
        /*
        'votes',
        'votes.voting',
        'votes.voting.reading',
        'votes.voting.reading.motion'
        */
       'attendedRegistrations',
       'missedRegistrations',
    ]}))[0];

    const attendedDays = uniqBy(deputy.attendedRegistrations, r => r.date.toLocaleDateString());
    const missedDays = uniqBy(deputy.missedRegistrations, r => r.date.toLocaleDateString());

    console.log('attended:', attendedDays.length, 'missed:', missedDays.length );

    process.exit();
};

const calculateDeputyVotingStats = async () => {
    const deputies = await Deputy.find();

    const votings = await Voting.find({ take: 20, relations: [
        'votes',
        'reading',
        'reading.motion',
    ]});

    const stats: VotingStats = deputies.map(d => { 
        return { deputyId: d.id, others: [] };
    });

    for (const i in votings) {
        const voting = votings[i];

        for (const j in voting.votes) {
            const vote = voting.votes[j];
            const statsEntry = stats.find(s => s.deputyId === vote.deputyId);

            for (const k in voting.votes) {
                const otherVote = voting.votes[k];

                if (otherVote.deputyId === vote.deputyId) {
                    continue;
                }

                let entryToUpdate = statsEntry.others.find(o => o.deputyId === otherVote.deputyId);

                if (entryToUpdate === undefined) {
                    entryToUpdate = { deputyId: otherVote.deputyId, same: 0, opposite: 0 };
                    statsEntry.others.push(entryToUpdate);
                }

                if (vote.type === otherVote.type) {
                    entryToUpdate.same++;
                } else {
                    entryToUpdate.opposite++;
                }
            }
        }
    }

    console.log(inspect(stats, true, 5));
};

const main = async () => {
    await createConnection();
    await calculateDeputyVotingStats();
};

main();