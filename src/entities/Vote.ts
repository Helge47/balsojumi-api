import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import Deputy from './Deputy';
import Proposal from './Proposal';

export enum VoteType {
    FOR = 'Par',
    AGAINST = 'Pret',
    NO_VOTE = 'Nebalsoja',
    //ABSTAIN = 'abstain'
};

@Entity()
@Index(['deputy', 'proposal'], { unique: true })
class Vote extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: VoteType;

    @ManyToOne(() => Deputy, (deputy) => deputy.votes)
    deputy: Deputy;

    @ManyToOne(() => Proposal, (proposal) => proposal.votes)
    proposal: Proposal;
}

export default Vote;