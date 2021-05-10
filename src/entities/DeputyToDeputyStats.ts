import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import Deputy from './Deputy';

@Entity()
@ObjectType()
class DeputyToDeputyStats extends BaseEntity {

    static make(owner: Deputy, comparedTo: Deputy) {
        const s = new DeputyToDeputyStats();
        s.owner = owner;
        s.comparedTo = comparedTo;
        s.sameVotes = 0;
        s.differentVotes = 0;
        s.supportedMotions = 0;
        s.abstainedMotions = 0;
        s.opposedMotions = 0;

        return s;
    }

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @ManyToOne(() => Deputy, deputy => deputy.deputyStats)
    owner: Deputy;

    @ManyToOne(() => Deputy, deputy => deputy.deputyComparisons)
    comparedTo: Deputy;

    @Column('int')
    @Field()
    sameVotes: number;

    @Column('int')
    @Field()
    differentVotes: number;
    
    @Column('int')
    @Field()
    supportedMotions: number;

    @Column('int')
    @Field()
    abstainedMotions: number;

    @Column('int')
    @Field()
    opposedMotions: number;
}

export default DeputyToDeputyStats;