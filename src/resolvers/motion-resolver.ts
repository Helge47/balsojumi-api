import { AttendanceRegistration, Motion, Reading } from "../entities";
import { Arg, FieldResolver, ID, Query, Resolver, Root } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import { Service } from "typedi";

@Resolver(of => Motion)
@Service()
export class MotionResolver {
    constructor(
        @InjectRepository(Motion) private readonly motionRepository: Repository<Motion>,
        @InjectRepository(Reading) private readonly readingRepository: Repository<Reading>,
        @InjectRepository(AttendanceRegistration) private readonly attendanceRepository: Repository<AttendanceRegistration>
    ) {}

    @Query(() => Motion, { nullable: true })
    motion(@Arg('motionId', type => ID) motionId: string): Promise<Motion> {
        return this.motionRepository.findOne(parseInt(motionId));
    }

    @Query(() => [Motion])
    motions(): Promise<Motion[]> {
        return this.motionRepository.find();
    }

    @FieldResolver()
    readings(@Root() motion: Motion): Promise<Reading[]> {
        return this.readingRepository.find({
            where: { motion: { id: motion.id } },
            relations: [ 'votings', 'voting.votes' ]
        });
    }
} 