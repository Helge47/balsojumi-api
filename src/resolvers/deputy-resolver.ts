import { Deputy, Mandate } from "../entities";
import { Arg, FieldResolver, Int, Query, Resolver, Root } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import { Service } from "typedi";

@Resolver(of => Deputy)
@Service()
export class DeputyResolver {
    constructor(@InjectRepository(Deputy) private readonly deputyRepository: Repository<Deputy>) {}

    @Query(returns => Deputy, { nullable: true })
    deputy(@Arg('deputyId', type => Int) deputyId: number): Promise<Deputy> {
        return this.deputyRepository.findOne(deputyId, { relations: ['mandates'] });
    }

    @Query(returns => [Deputy])
    deputies(): Promise<Deputy[]> {
        return this.deputyRepository.find({ relations: ['mandates'] });
    }
}