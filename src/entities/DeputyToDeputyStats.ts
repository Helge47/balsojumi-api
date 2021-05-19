import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Deputy from './Deputy';

@Entity()
@ObjectType()
@Index(['owner', 'comparedTo'], { unique: true })
class DeputyToDeputyStats extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @ManyToOne(() => Deputy, deputy => deputy.deputyStats)
    owner: Deputy;

    @ManyToOne(() => Deputy, deputy => deputy.deputyComparisons)
    comparedTo: Deputy;

    @Column('int', { default: 0 })
    @Field()
    sameVotes: number;

    @Column('int', { default: 0 })
    @Field()
    differentVotes: number;
    
    @Column('int', { default: 0 })
    @Field()
    supportedMotions: number;

    @Column('int', { default: 0 })
    @Field()
    abstainedMotions: number;

    @Column('int', { default: 0 })
    @Field()
    opposedMotions: number;
}

export default DeputyToDeputyStats;