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

    async run() {
        this.logger.log('Running StatisticsService');
        await this.calculateAttendanceStats();
        await this.calculateVotingStats();
        this.logger.log('StatisticsService finished working');
    }

    async createEntities() {
        const deputies = await this.deputyRepository.find({ relations: [
            'deputyStats'
        ]});

        for (const i in deputies) {
            for (const j in deputies) {
                if (i === j) {
                    continue;
                }

                if (deputies[i].deputyStats.some(s => s.comparedToId === deputies[j].id)) {
                    continue;
                }

                await this.deputyStatsRepository.create({
                    owner: deputies[i],
                    comparedTo: deputies[j],
                }).save();
            }
        }
    }

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

    async calculateFactionVotingStats(votings: Voting[]) {
        this.logger.log('calculating faction stats');
        const deputies = await this.deputyRepository.find({ relations: ['factionStats', 'factionStats.faction'] });
        const factions = await this.factionRepository.find({ relations: ['factionStats', 'factionStats.comparedTo'] });

        for (const i in votings) {
            const voting = votings[i];
            this.logger.log('processing voting', voting.id);
            const votingStatsByFaction = this.getFactionStatsForSingleVoting(voting);
            this.logger.log(votingStatsByFaction);

            for (const factionName in votingStatsByFaction) {
                const faction = factions.find(f => f.name === factionName || f.shortName === factionName);
    
                for (const otherFactionName in votingStatsByFaction) {
                    const otherFaction = factions.find(f => f.name === otherFactionName || f.shortName === otherFactionName);
    
                    let entryToUpdate = faction.factionStats.find(s => s.comparedToId === otherFaction.id);
                    if (entryToUpdate === undefined) {
                        entryToUpdate = this.factionToFactionStatsRepository.create({
                            comparedTo: otherFaction,
                            sameVotes: 0,
                            oppositeVotes: 0,
                        });
                        faction.factionStats.push(entryToUpdate);
                    }
    
                    if (votingStatsByFaction[factionName].popularVote === votingStatsByFaction[otherFactionName].popularVote) {
                        entryToUpdate.sameVotes++;
                    } else {
                        entryToUpdate.oppositeVotes++;
                    }
                }
            }

            this.logger.log('calculating deputy stats');
    
            for (const j in voting.votes) {
                const vote = voting.votes[j];
                const deputy = deputies.find(d => d.id === vote.deputyId);
                const faction = factions.find(
                    f => f.name === vote.currentDeputyFaction || f.shortName === vote.currentDeputyFaction
                );
    
                let deputyFactionEntry = deputy.factionStats.find(s => s.faction.id === faction.id);
                if (deputyFactionEntry === undefined) {
                    deputyFactionEntry = this.deputyFactionStatsRepository.create({
                        faction: faction,
                        popularVotes: 0,
                        unpopularVotes: 0,
                    });
                    deputy.factionStats.push(deputyFactionEntry);
                }

                if (vote.type === votingStatsByFaction[vote.currentDeputyFaction].popularVote) {
                    deputyFactionEntry.popularVotes++;
                } else {
                    deputyFactionEntry.unpopularVotes++;
                }
            }
        }

        this.logger.log('saving', deputies);
        await this.deputyRepository.save(deputies, { chunk: 10 });
        this.logger.log('saving', factions);
        await this.factionRepository.save(factions, { chunk: 10 });
    }

    async calculateDeputyVotingStats(votings: Voting[]) {
        const deputies = await this.deputyRepository.find({ relations: ['deputyStats'] });

        for (const i in votings) {
            const voting = votings[i];

            for (const j in voting.votes) {
                const vote = voting.votes[j];
                const deputy = deputies.find(d => d.id === vote.deputyId);

                for (const k in voting.reading.motion.submitters) {
                    const submitter = voting.reading.motion.submitters[k];
                    if (deputy.id === submitter.id) {
                        continue;
                    }

                    let entryToUpdate = deputy.deputyStats.find(s => s.comparedToId === submitter.id);
                    if (entryToUpdate === undefined) {
                        throw 'DeputyToDeputyStats entity not found - need to run entities creation first ' + deputy.id + ' ' + submitter.id;
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

                    let entryToUpdate = deputy.deputyStats.find(s => s.comparedToId === otherVote.deputyId);
                    if (entryToUpdate === undefined) {
                        throw 'DeputyToDeputyStats entity not found - need to run entities creation first'
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
    }

    async calculateVotingStats() {
        const votings = await this.votingRepository.find({ where: { isProcessed: false, method: 'default' }, take: 10, relations: [
            'votes',
            'reading',
            'reading.motion',
            'reading.motion.submitters',
        ]});

        await this.calculateFactionVotingStats(votings);
        await this.calculateDeputyVotingStats(votings);

        for (const i in votings) {
            votings[i].isProcessed = true;
        }

        this.logger.log('saving votings');
        await this.votingRepository.save(votings);
    };

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
                    Par: votesByType['Par'] || [],
                    Pret: votesByType['Pret'] || [],
                    Atturas: votesByType['Atturas'] || [],
                    Nebalsoja: votesByType['Nebalsoja'] || [],
                };
            }
        )
    }
}