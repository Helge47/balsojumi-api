import { Sitting } from "../entities";
import { Arg, Int, Query, Resolver } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import { Service } from "typedi";

@Resolver(of => Sitting)
@Service()
export class SittingResolver {
    constructor(@InjectRepository(Sitting) private readonly sittingRepository: Repository<Sitting>) {}

    @Query(returns => Sitting, { nullable: true })
    sitting(@Arg('sittingId', type => Int) sittingId: number): Promise<Sitting> {
        return this.sittingRepository.findOne(sittingId, { relations: ['readings'] });
    }

    @Query(returns => [Sitting])
    sittings(): Promise<Sitting[]> {
        return this.sittingRepository.find({ relations: ['readings'] });
    }
}