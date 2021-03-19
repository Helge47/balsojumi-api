import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import DeputyRecord from './DeputyRecord';
import Mandate from './Mandate';
import Vote from './Vote';

@Entity()
@ObjectType()
class Deputy extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column()
    @Field()
    name: string;

    @Column()
    @Field()
    surname: string;

    @Column()
    @Field()
    currentFaction: string;

    @Column()
    @Field()
    birthYear: string;

    @Column()
    @Field()
    email: string;

    @Column()
    @Field()
    residence: string;

    @OneToMany(() => Mandate, mandate => mandate.deputy)
    @Field(type => [Mandate])
    mandates: Mandate[];

    @OneToMany(() => Vote, vote => vote.deputy)
    votes: Vote[];

    @OneToMany(() => DeputyRecord, record => record.deputy)
    records: DeputyRecord[];
}

export default Deputy;