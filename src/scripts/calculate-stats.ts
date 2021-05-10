import { Deputy, VoteType, Voting } from "../entities";
import { createConnection } from "typeorm";
import { groupBy, mapValues, uniqBy } from "lodash";
import Faction from "../entities/Faction";
import FactionToFactionStats from "../entities/FactionToFactionStats";
import DeputyToFactionStats from "../entities/DeputyToFactionStats";
import DeputyToDeputyStats from "../entities/DeputyToDeputyStats";

const calculateAttendanceStats = async () => {
    const deputy = (await Deputy.find({ take: 1, relations: [
       'attendedRegistrations',
       'missedRegistrations',
    ]}))[0];

    deputy.attendedSittingNumber = uniqBy(deputy.attendedRegistrations, r => r.date.toLocaleDateString()).length;
    deputy.missedSittingNumber = uniqBy(deputy.missedRegistrations, r => r.date.toLocaleDateString()).length;

    console.log('saving', deputy);
    await deputy.save();

    process.exit();
};

const getFactionStatsForSingleVoting = (voting: Voting) => {
    return mapValues(
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
};

const calculateVotingStats = async () => {
    const deputies = await Deputy.find({ relations: ['deputyStats', 'deputyStats.comparedTo', 'factionStats'] });
    const factions = await Faction.find({ relations: ['votingStats', 'votingStats.comparedTo'] });

    const votings = await Voting.find({ take: 20, relations: [
        'votes',
        'reading',
        'reading.motion',
        'reading.motion.submitters',
    ]});

    const factionToFactionStats: FactionToFactionStats[] = [];

    for (const i in votings) {
        const voting = votings[i];
        console.log('processing voting', voting.id);
        const votingStatsByFaction = getFactionStatsForSingleVoting(voting);

        for (const factionName in votingStatsByFaction) {
            const faction = factions.find(f => f.name === factionName || f.shortName === factionName);

            for (const otherFactionName in votingStatsByFaction) {
                const otherFaction = factions.find(f => f.name === otherFactionName || f.shortName === otherFactionName);

                let entryToUpdate = faction.factionStats.find(s => s.comparedTo.id === otherFaction.id);
                if (entryToUpdate === undefined) {
                    entryToUpdate = FactionToFactionStats.make(faction, otherFaction);
                    factionToFactionStats.push(entryToUpdate);
                }

                if (votingStatsByFaction[factionName].popularVote === votingStatsByFaction[otherFactionName].popularVote) {
                    entryToUpdate.sameVotes++;
                } else {
                    entryToUpdate.oppositeVotes++;
                }
            }
        }

        for (const j in voting.votes) {
            const vote = voting.votes[j];
            const deputy = deputies.find(d => d.id === vote.deputyId);
            const faction = factions.find(
                f => f.name === vote.currentDeputyFaction || f.shortName === vote.currentDeputyFaction
            );

            let deputyFactionEntry = deputy.factionStats.find(s => s.faction.id === faction.id);
            if (deputyFactionEntry === undefined) {
                deputyFactionEntry = DeputyToFactionStats.make(deputy, faction);               
                deputy.factionStats.push(deputyFactionEntry);
            }
            
            if (vote.type === votingStatsByFaction[vote.currentDeputyFaction].popularVote) {
                deputyFactionEntry.popularVotes++;
            } else {
                deputyFactionEntry.unpopularVotes++;
            }

            for (const k in voting.reading.motion.submitters) {
                const submitter = voting.reading.motion.submitters[k];

                let entryToUpdate = deputy.deputyStats.find(s => s.comparedTo.id === submitter.id);
                if (entryToUpdate === undefined) {
                    entryToUpdate = DeputyToDeputyStats.make(deputy, submitter);
                    deputy.deputyStats.push(entryToUpdate);
                }

                if (vote.type === 'Par') {
                    entryToUpdate.supportedMotions++;
                } else if (vote.type === 'Pret') {
                    entryToUpdate.opposedMotions++;
                } else if (vote.type === 'Atturas') {
                    entryToUpdate.abstainedMotions++;
                }
            }

            for (const k in voting.votes) {
                const otherVote = voting.votes[k];
                if (otherVote.deputyId === vote.deputyId) {
                    continue;
                }
                const otherDeputy = deputies.find(d => d.id === otherVote.deputyId);

                let entryToUpdate = deputy.deputyStats.find(s => s.comparedTo.id === otherVote.deputyId);
                if (entryToUpdate === undefined) {
                    entryToUpdate = DeputyToDeputyStats.make(deputy, otherDeputy);
                    deputy.deputyStats.push(entryToUpdate);
                }

                if (vote.type === otherVote.type) {
                    entryToUpdate.sameVotes++;
                } else {
                    entryToUpdate.differentVotes++;
                }
            }
        }
    }

    for (const i in deputies) {
        console.log('saving', deputies[i]);
        await deputies[i].save();
    }

    for (const i in factions) {
        console.log('saving', factions[i]);
        await factions[i].save();
    }
};

const main = async () => {
    await createConnection();
    await calculateAttendanceStats();
    await calculateVotingStats();
    console.log('Done!');
    process.exit();
};

main();