import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import AttendanceRegistration from './AttendanceRegistration';
import Deputy from './Deputy';
import Reading from './Reading';
import Voting from './Voting';

export type SittingType = 'default' | 'closed' | 'emergency' | 'emergencySession' | 'qa' | 'formal';

@Entity()
@ObjectType()
class Sitting extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(() => ID)
    id: number;

    @Column({ type: 'date' })
    @Field()
    date: string;

    @Column()
    @Field()
    type: SittingType;

    @Column({ unique: true })
    @Field()
    saeimaUid: string;

    @OneToMany(() => Reading, reading => reading.sitting, { cascade: true })
    @Field(type => [Reading])
    readings: Reading[];

    @OneToMany(() => AttendanceRegistration, registration => registration.sitting, { cascade: true })
    @Field(() => [AttendanceRegistration])
    attendanceRegistrations: AttendanceRegistration[];
}

export default Sitting;