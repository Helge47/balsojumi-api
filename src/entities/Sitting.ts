import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Proposal from './Proposal';

export enum SittingType {
    DEFAULT = 'default',
    CLOSED = 'closed',
    EMERGENCY = 'emergency',
    EMERGENCY_SESSION = 'emergencySession',
    QA = 'qa',
    FORMAL = 'formal',
};

@Entity()
class Sitting extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date' })
    date: Date;

    @Column()
    type: SittingType;

    @Column({ unique: true })
    saeimaUid: string;

    @Column({ default: false })
    isScraped: Boolean;

    @OneToMany(() => Proposal, (proposal) => proposal.sitting)
    proposals: Proposal[];
}

export default Sitting;