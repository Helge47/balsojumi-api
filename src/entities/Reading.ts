import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Index } from 'typeorm';
import Motion from './Motion';
import Sitting from './Sitting';
import Voting from './Voting';

@Entity()
@Index(['sitting', 'motion'], { unique: true })
@ObjectType()
class Reading extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column({ nullable: true })
    @Field({ nullable: true })
    title: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    outcome: string;

    @Column({ length: 5000, nullable: true })
    docs: string;

    @Column({ type: 'date', nullable: true })
    @Field({ nullable: true })
    date: string;

    @Column({ default: false })
    @Field()
    isVotingAnonymous: boolean;

    @OneToMany(() => Voting, voting => voting.reading, { cascade: true })
    @Field(type => [Voting])
    votings: Voting[];

    @ManyToOne(() => Sitting, sitting => sitting.readings, { nullable: true })
    sitting: Sitting;

    @ManyToOne(() => Motion, motion => motion.readings)
    @Field()
    motion: Motion;
}

export default Reading;