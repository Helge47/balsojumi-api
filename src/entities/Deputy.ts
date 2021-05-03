import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import DeputyRecord from './DeputyRecord';
import Mandate from './Mandate';
import Sitting from './Sitting';
import Vote from './Vote';
import AttendanceRegistration from './AttendanceRegistration';
import Motion from './Motion';

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

    @ManyToMany(() => AttendanceRegistration, registration => registration.attendees)
    attendedRegistrations: AttendanceRegistration[];

    @ManyToMany(() => AttendanceRegistration, registration => registration.absentees)
    missedRegistrations: AttendanceRegistration[];

    @ManyToMany(() => Motion, motion => motion.submitters)
    submittedMotions: Motion[];
}

export default Deputy;