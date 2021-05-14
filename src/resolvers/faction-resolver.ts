import { DeputyToFactionStats, Faction, FactionToFactionStats } from "../entities";
import { Arg, FieldResolver, Int, Query, Resolver, Root } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import { Service } from "typedi";

@Resolver(of => Faction)
@Service()
export class FactionResolver {
    constructor(
        @InjectRepository(Faction) private readonly factionRepository: Repository<Faction>,
        @InjectRepository(FactionToFactionStats) private readonly factionStatsRepository: Repository<FactionToFactionStats>,
        @InjectRepository(DeputyToFactionStats) private readonly deputyStatsRepository: Repository<DeputyToFactionStats>,
    ) {}

    @Query(returns => Faction, { nullable: true })
    faction(@Arg('factionId', type => Int) factionId: number): Promise<Faction> {
        return this.factionRepository.findOne(factionId);
    }    

    @Query(returns => [Faction])
    factions(): Promise<Faction[]> {
        return this.factionRepository.find();
    }

    @FieldResolver()
    factionStats(@Root() faction: Faction): Promise<FactionToFactionStats[]> {
        return this.factionStatsRepository.find({ where: { owner: { id: faction.id } }});
    }

    @FieldResolver()
    deputyStats(@Root() faction: Faction): Promise<DeputyToFactionStats[]> {
        return this.deputyStatsRepository.find({ where: { faction: { id: faction.id } }});
    }
}