import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Vote from './Vote';

export enum Party {
    APAR = 'AP!',
    NA = 'NA',
    JKP = 'JKP',
    ZZS = 'ZZS',
    S = 'SASKA&#325;A',
    KPV = 'KPV LV',
    NONE = '',
};

@Entity()
class Deputy extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    party: Party;

    @OneToMany(() => Vote, (vote) => vote.deputy)
    votes: Vote[];
}

export default Deputy;