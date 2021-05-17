import { Deputy, DeputyToDeputyStats, DeputyToFactionStats, Faction, FactionToFactionStats, VoteType, Voting } from "../entities";
import { Service } from "typedi";
import { Repository } from "typeorm";
import { InjectRepository } from "typeorm-typedi-extensions";
import { groupBy, mapValues, uniqBy } from "lodash";
import { LoggingService } from "./logging-service";

@Service()
export class StatisticsService {
    constructor(
        @InjectRepository(Deputy) private readonly deputyRepository: Repository<Deputy>,
        @InjectRepository(Faction) private readonly factionRepository: Repository<Faction>,
        @InjectRepository(Voting) private readonly votingRepository: Repository<Voting>,
        @InjectRepository(DeputyToDeputyStats) private readonly deputyStatsRepository: Repository<DeputyToDeputyStats>,
        @InjectRepository(DeputyToFactionStats) private readonly deputyFactionStatsRepository: Repository<DeputyToFactionStats>,
        @InjectRepository(FactionToFactionStats) private readonly factionToFactionStatsRepository: Repository<FactionToFactionStats>,
        private readonly logger: LoggingService,    
    ) {}

    async calculateAttendanceStats() {
        const deputies = await this.deputyRepository.find({ relations: [
            'attendedRegistrations',
            'missedRegistrations',
        ]});

        for (const i in deputies) {
            const d = deputies[i];
            d.attendedSittingNumber = uniqBy(d.attendedRegistrations, r => r.date.toLocaleDateString()).length;
            d.missedSittingNumber = uniqBy(d.missedRegistrations, r => r.date.toLocaleDateString()).length;
        }

        await this.deputyRepository.save(deputies, /*{ chunk: 2 }*/);
        this.logger.log('saved', deputies)
    }

    private getFactionStatsForSingleVoting = (voting: Voting) => {
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
        )
    }

    private async calculateVotingStats() {
        const deputies = await this.deputyRepository.find({ relations: ['deputyStats', 'deputyStats.comparedTo', 'factionStats'] });
        const factions = await this.factionRepository.find({ relations: ['votingStats', 'votingStats.comparedTo'] });
        const votings = await this.votingRepository.find({ take: 20, relations: [
            'votes',
            'reading',
            'reading.motion',
            'reading.motion.submitters',
        ]});
    
        const factionToFactionStats: FactionToFactionStats[] = [];
    
        for (const i in votings) {
            const voting = votings[i];
            this.logger.log('processing voting', voting.id);
            const votingStatsByFaction = this.getFactionStatsForSingleVoting(voting);
    
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
                    deputyFactionEntry = this.deputyFactionStatsRepository.create({
                        deputy: deputy,
                        faction: faction,
                    });
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
                        entryToUpdate = this.deputyStatsRepository.create({
                            owner: deputy,
                            comparedTo: submitter
                        });
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
                        entryToUpdate = this.deputyStatsRepository.create({
                            owner: deputy,
                            comparedTo: otherDeputy,
                        });
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
    
        this.logger.log('saving', deputies);
        await this.deputyRepository.save(deputies, { chunk: 10 });
        this.logger.log('saving', factions);
        await this.factionRepository.save(factions, { chunk: 10 });

    };
}