import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Index } from 'typeorm';
import Motion from './Motion';
import Sitting from './Sitting';
import Vote from './Vote';

//Reading == lasijums

type ReadingObject = 'Bill' | 'Decision' | 'Request';

@Entity()
@Index(['sitting', 'motion'], { unique: true })
@ObjectType()
class Reading extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column({ nullable: true })
    @Field()
    title: string;

    @Column({ nullable: true })
    @Field()
    outcome: string;

    @Column({ length: 1000, nullable: true })
    docs: string;

    @Column({ type: 'date', nullable: true })
    @Field()
    date: string;

    @Column({ nullable: true })
    @Field()
    votingUid: string;

    @Column({ default: false })
    @Field()
    isVotingAnonymous: boolean;

    @OneToMany(() => Vote, vote => vote.reading, { cascade: true })
    votes: Vote[];

    @ManyToOne(() => Sitting, sitting => sitting.readings, { nullable: true })
    sitting: Sitting;

    @ManyToOne(() => Motion, motion => motion.readings)
    motion: Motion;
}

export default Reading;