import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import Deputy from './Deputy';

@Entity()
class Mandate extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    candidateList: string;

    @Column()
    isActive: boolean;

    @Column()
    reason: string;

    @Column({ nullable: true })
    laidDownReason: string;

    @Column()
    date: Date;

    @Column({ nullable: true })
    laidDownDate: Date;

    @ManyToOne(() => Deputy, (deputy) => deputy.mandates)
    deputy: Deputy;
}

export default Mandate;