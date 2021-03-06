import { AttendanceRegistration, Reading, Sitting } from "../entities";
import { Arg, Field, FieldResolver, ID, Int, Query, Resolver, Root } from "type-graphql";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import { Service } from "typedi";

@Resolver(of => Sitting)
@Service()
export class SittingResolver {
    constructor(
        @InjectRepository(Sitting) private readonly sittingRepository: Repository<Sitting>,
        @InjectRepository(Reading) private readonly readingRepository: Repository<Reading>,
        @InjectRepository(AttendanceRegistration) private readonly attendanceRepository: Repository<AttendanceRegistration>
    ) {}

    @Query(returns => Sitting, { nullable: true })
    sitting(@Arg('sittingId', type => ID) sittingId: string): Promise<Sitting> {
        return this.sittingRepository.findOne(parseInt(sittingId));
    }

    @Query(returns => [Sitting])
    sittings(): Promise<Sitting[]> {
        return this.sittingRepository.find();
    }

    @FieldResolver()
    readings(@Root() sitting: Sitting): Promise<Reading[]> {
        return this.readingRepository.find({
            where: { sitting: { id: sitting.id } },
            relations: [ 'motion', 'votings', 'voting.votes' ]
        });
    }

    @FieldResolver()
    attendanceRegistrations(@Root() sitting: Sitting): Promise<AttendanceRegistration[]> {
        return this.attendanceRepository.find({ where: { sitting: { id: sitting.id }}, loadRelationIds: true });
    }
} 