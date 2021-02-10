import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Proposal from './Proposal';

export enum MeetingType {
    DEFAULT = 'default',
    CLOSED = 'closed',
    EMERGENCY = 'emergency',
    EMERGENCY_SESSION = 'emergencySession',
    QA = 'qa',
    FORMAL = 'formal',
};

@Entity()
class Meeting extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date' })
    date: Date;

    @Column()
    type: MeetingType;

    @Column({ unique: true })
    saeimaUid: string;

    @Column({ default: false })
    isScraped: Boolean;

    @OneToMany(() => Proposal, (proposal) => proposal.meeting)
    proposals: Proposal[];
}

export default Meeting;