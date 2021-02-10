import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Meeting from './Meeting';
import Vote from './Vote';

@Entity()
class Proposal extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', { length: 2000 })
    title: string;

    @Column({ unique: true })
    saeimaUid: string;

    @Column({ nullable: true })
    lawProjectNumber: string;

    @Column({ nullable: true })
    votingUid: string;

    @Column('varchar', { length: 1000, nullable: true })
    commission: string;

    @Column()
    outcome: string;

    @Column({ default: false })
    isScraped: Boolean;

    @Column({ default: false })
    isAnonymous: Boolean;

    @ManyToOne(() => Meeting, (meeting) => meeting.proposals)
    meeting: Meeting;

    @OneToMany(() => Vote, (vote) => vote.proposal)
    votes: Vote[];
}

export default Proposal;