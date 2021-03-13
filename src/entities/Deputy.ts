import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import DeputyRecord from './DeputyRecord';
import Mandate from './Mandate';
import Vote from './Vote';

@Entity()
class Deputy extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    surname: string;

    @Column()
    currentFaction: string;

    @Column()
    birthYear: string;

    @Column()
    email: string;

    @Column()
    residence: string;

    @OneToMany(() => Mandate, mandate => mandate.deputy)
    mandates: Mandate[];

    @OneToMany(() => Vote, vote => vote.deputy)
    votes: Vote[];

    @OneToMany(() => DeputyRecord, record => record.deputy)
    records: DeputyRecord[];
}

export default Deputy;