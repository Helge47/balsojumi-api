import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, Index, JoinColumn } from 'typeorm';
import Deputy from './Deputy';
import Voting from './Voting';

export type VoteType = 'Par' | 'Pret' | 'Nebalsoja' | 'Atturas';

@Entity()
@Index(['deputy', 'voting'], { unique: true })
@ObjectType()
class Vote extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column()
    @Field()
    type: VoteType;

    @Column()
    @Field()
    currentDeputyFaction: string;

    @Column()
    @Field()
    deputyId: number;

    @ManyToOne(() => Deputy, deputy => deputy.votes)
    @JoinColumn()
    deputy: Deputy;

    @ManyToOne(() => Voting, voting => voting.votes)
    voting: Voting;
}

export default Vote;