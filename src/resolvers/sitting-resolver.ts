import { Sitting } from "../entities";
import { Arg, ID, Int, Query, Resolver } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import { Service } from "typedi";

@Resolver(of => Sitting)
@Service()
export class SittingResolver {
    constructor(@InjectRepository(Sitting) private readonly sittingRepository: Repository<Sitting>) {}

    @Query(returns => Sitting, { nullable: true })
    sitting(@Arg('sittingId', type => ID) sittingId: string): Promise<Sitting> {
        return this.sittingRepository.findOne(parseInt(sittingId), { relations: [ 'readings', 'readings.motion', 'readings.votings', 'readings.votings.votes' ] });
    }

    @Query(returns => [Sitting])
    sittings(): Promise<Sitting[]> {
        return this.sittingRepository.find();
    }
}