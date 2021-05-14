import { Deputy, DeputyToDeputyStats, DeputyToFactionStats } from "../entities";
import { Arg, FieldResolver, Int, Query, Resolver, Root } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import { Service } from "typedi";

@Resolver(of => Deputy)
@Service()
export class DeputyResolver {
    constructor(
        @InjectRepository(Deputy) private readonly deputyRepository: Repository<Deputy>,
        @InjectRepository(DeputyToDeputyStats) private readonly deputyStatsRepository: Repository<DeputyToDeputyStats>,
        @InjectRepository(DeputyToFactionStats) private readonly factionStatsRepository: Repository<DeputyToFactionStats>
    ) {}

    @Query(returns => Deputy, { nullable: true })
    deputy(@Arg('deputyId', type => Int) deputyId: number): Promise<Deputy> {
        return this.deputyRepository.findOne(deputyId, { relations: ['mandates'] });
    }

    @Query(returns => [Deputy])
    deputies(): Promise<Deputy[]> {
        const deputies = this.deputyRepository.find({ relations: ['mandates'] });
        return deputies;
    }

    @FieldResolver()
    deputyStats(@Root() deputy: Deputy): Promise<DeputyToDeputyStats[]> {
        return this.deputyStatsRepository.find({ where: { owner: { id: deputy.id } }})
    }

    @FieldResolver()
    factionStats(@Root() deputy: Deputy): Promise<DeputyToFactionStats[]> {
        return this.factionStatsRepository.find({ where: { deputy: { id: deputy.id } }})
    }
} 