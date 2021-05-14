import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import Deputy from './Deputy';

@Entity()
class DeputyRecord extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    surname: string;

    @Column()
    parliamentNumber: string;

    @Column()
    path: string;

    @Column({ unique: true })
    uid: string;

    @Column({ nullable: true })
    deputyId: number;

    @ManyToOne(() => Deputy, deputy => deputy.records, { nullable: true })
    @JoinColumn()
    deputy: Deputy;
}

export default DeputyRecord;