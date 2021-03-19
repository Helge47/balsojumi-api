import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import Deputy from './Deputy';
import Reading from './Reading';

export enum VoteType {
    FOR = 'Par',
    AGAINST = 'Pret',
    NO_VOTE = 'Nebalsoja',
};

@Entity()
@Index(['deputy', 'reading'], { unique: true })
class Vote extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: VoteType;

    @ManyToOne(() => Deputy, deputy => deputy.votes)
    deputy: Deputy;

    @ManyToOne(() => Reading, reading => reading.votes)
    reading: Reading;
}

export default Vote;