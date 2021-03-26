import { Deputy } from "../entities";
import { Arg, Int, Query, Resolver } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import { Service } from "typedi";
import { inspect } from "util";

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
        const deputies = this.deputyRepository.find({ relations: ['mandates'] }).then(d => {
            console.log(inspect(d.map(d => d.mandates)));
            return d;
        });
        return deputies;
    }
}