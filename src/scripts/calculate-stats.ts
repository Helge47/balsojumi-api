import { Deputy, VoteType, Voting } from "../entities";
import { createConnection } from "typeorm";
import { groupBy, mapValues, uniqBy } from "lodash";
import { inspect } from "util";

type DeputyVotingStats = { 
    deputyId: number,
    voteComparisons: { deputyId: number, same: number, opposite: number }[],
    proposalSupport: { deputyId: number, supported: number, opposed: number }[],
}[];

type FactionVotingStats = {
    factionName: string,
    voteComparisons: { factionName: string, same: number, opposite: number }[],
    deputyStats: { deputyId: number, popularVotes: number, unpopularVotes: number }[],
    unanimousVotings: number,
    mixedVotings: number,
}[];

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
        'reading.motion.submitters',
    ]});

    const stats: DeputyVotingStats = deputies.map(d => { 
        return { deputyId: d.id, voteComparisons: [], proposalSupport: [] };
    });

    const factionStats: FactionVotingStats = [];

    for (const i in votings) {
        const voting = votings[i];

        const voteStatsByFaction = mapValues(
            groupBy(voting.votes, v => v.currentDeputyFaction),
            votes => {
                const votesByType = groupBy(votes, v => v.type);

                let mostPopularVote;
                for (const type in votesByType) {
                    if (mostPopularVote === undefined || votesByType[type].length > votesByType[mostPopularVote].length) {
                        mostPopularVote = type;
                    }
                }

                return {
                    popularVote: mostPopularVote as VoteType,
                    popularVotePercentage: votesByType[mostPopularVote].length / voting.votes.filter(v => v.type !== 'Nebalsoja').length,
                    Par: votesByType['Par'] || [],
                    Pret: votesByType['Pret'] || [],
                    Atturas: votesByType['Atturas'] || [],
                    Nebalsoja: votesByType['Nebalsoja'] || [],
                };
            }
        );

        for (const factionName in voteStatsByFaction) {
            let factionEntry = factionStats.find(e => e.factionName === factionName);
            if (factionEntry === undefined) {
                factionEntry = { factionName: factionName, voteComparisons: [], deputyStats: [], unanimousVotings: 0, mixedVotings: 0 };
                factionStats.push(factionEntry);
            }

            for (const otherFactionName in voteStatsByFaction) {
                let entryToUpdate = factionEntry.voteComparisons.find(e => e.factionName === otherFactionName);
                if (entryToUpdate === undefined) {
                    entryToUpdate = { factionName: otherFactionName, same: 0, opposite: 0 };
                    factionEntry.voteComparisons.push(entryToUpdate);
                }

                if (voteStatsByFaction[factionName].popularVote === voteStatsByFaction[otherFactionName].popularVote) {
                    entryToUpdate.same++;
                } else {
                    entryToUpdate.opposite++;
                }
            }
        }

        /*---------------------*/

        for (const j in voting.votes) {
            const vote = voting.votes[j];
            const statsEntry = stats.find(s => s.deputyId === vote.deputyId);

            const factionEntry = factionStats.find(e => e.factionName === vote.currentDeputyFaction);
            let factionDeputyEntry = factionEntry.deputyStats.find(e => e.deputyId === vote.deputyId);
            if (factionDeputyEntry === undefined) {
                factionDeputyEntry = { deputyId: vote.deputyId, popularVotes: 0, unpopularVotes: 0 };
                factionEntry.deputyStats.push(factionDeputyEntry);
            }

            if (vote.type === voteStatsByFaction[vote.currentDeputyFaction].popularVote) {
                factionDeputyEntry.popularVotes++;
            } else {
                factionDeputyEntry.unpopularVotes++;
            }

            //TODO: compare deputy's vote to popular vote of his faction and add it to stats.d
            //voteStatsByFaction[vote.currentDeputyFaction].popularVote;
            
            for (const k in voting.reading.motion.submitters) {
                const submitter = voting.reading.motion.submitters[k];

                let entryToUpdate = statsEntry.proposalSupport.find(p => p.deputyId === submitter.id);

                if (entryToUpdate === undefined) {
                    entryToUpdate = { deputyId: submitter.id, supported: 0, opposed: 0 };
                    statsEntry.proposalSupport.push(entryToUpdate);
                }

                if (vote.type === 'Par') {
                    entryToUpdate.supported++;
                } else if (vote.type === 'Pret') {
                    entryToUpdate.opposed++;
                }
            }

            for (const k in voting.votes) {
                const otherVote = voting.votes[k];

                if (otherVote.deputyId === vote.deputyId) {
                    continue;
                }

                let entryToUpdate = statsEntry.voteComparisons.find(c => c.deputyId === otherVote.deputyId);

                if (entryToUpdate === undefined) {
                    entryToUpdate = { deputyId: otherVote.deputyId, same: 0, opposite: 0 };
                    statsEntry.voteComparisons.push(entryToUpdate);
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

    //deputy-to-deputy voting stats
    //party-to-party voting stats
    //deputy-to-party? at least to their own
    //deputy personal stats
};

main();