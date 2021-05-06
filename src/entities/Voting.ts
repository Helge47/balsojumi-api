import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Reading from './Reading';
import Vote from './Vote';

export type VotingMethod = 'anonymous' | 'default';
export type VotingType = 'primary' | 'secondary';
@Entity()
@ObjectType()
class Voting extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column()
    @Field()
    uid: string;

    @Column({ default: 'default' })
    @Field()
    type: VotingType;

    @Column()
    @Field()
    method: VotingMethod;

    @Column({ type: 'datetime', nullable: true, default: null })
    @Field({ nullable: true })
    date: Date;

    @OneToMany(() => Vote, vote => vote.voting, { cascade: true })
    @Field(type => [Vote])
    votes: Vote[];

    @ManyToOne(() => Reading, reading => reading.votings)
    @Field(type => Reading)
    reading: Reading;
}

export default Voting;