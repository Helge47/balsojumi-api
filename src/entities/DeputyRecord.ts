import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

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

    @Column()
    uid: string;
}

export default DeputyRecord;