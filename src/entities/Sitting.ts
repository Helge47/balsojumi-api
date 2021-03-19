import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Reading from './Reading';

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

    @OneToMany(() => Reading, reading => reading.sitting)
    readings: Reading[];
}

export default Sitting;