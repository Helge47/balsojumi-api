import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, JoinTable, Entity, ManyToOne, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import Sitting from './Sitting';
import Deputy from './Deputy';

@Entity()
@ObjectType()
class AttendanceRegistration extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column({ type: 'datetime', nullable: true, default: null })
    @Field({ nullable: true })
    date: Date;

    @Column({ unique: true })
    uid: string;

    @Column({ unique: true })
    votingUid: string;

    @ManyToOne(() => Sitting, sitting => sitting.attendanceRegistrations)
    sitting: Sitting;

    @ManyToMany(() => Deputy, deputy => deputy.attendedRegistrations, { cascade: true })
    @JoinTable({ name: 'registration_attendees'})
    @Field(type => [Deputy])
    attendees: Deputy[];

    @ManyToMany(() => Deputy, deputy => deputy.missedRegistrations, { cascade: true })
    @JoinTable({ name: 'registration_absentees' })
    @Field(type => [Deputy])
    absentees: Deputy[];
}

export default AttendanceRegistration;