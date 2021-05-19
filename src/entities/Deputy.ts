import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import DeputyRecord from './DeputyRecord';
import Mandate from './Mandate';
import Vote from './Vote';
import AttendanceRegistration from './AttendanceRegistration';
import Motion from './Motion';
import DeputyToFactionStats from './DeputyToFactionStats';
import DeputyToDeputyStats from './DeputyToDeputyStats';
import Faction from './Faction';

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
    birthYear: string;

    @Column()
    @Field()
    email: string;

    @Column()
    @Field()
    residence: string;

    @Column('int', { default: 0 })
    @Field()
    missedSittingNumber: number;
    
    @Column('int', { default: 0 })
    @Field()
    attendedSittingNumber: number;

    @Column({ nullable: true, default: null })
    @Field()
    currentFactionId: number;

    @ManyToOne(() => Faction, faction => faction.currentMembers)
    @JoinColumn()
    currentFaction: Faction;

    @OneToMany(() => Mandate, mandate => mandate.deputy, { cascade: true })
    @Field(type => [Mandate])
    mandates: Mandate[];

    @OneToMany(() => Vote, vote => vote.deputy)
    votes: Vote[];

    @OneToMany(() => DeputyRecord, record => record.deputy)
    records: DeputyRecord[];

    @OneToMany(() => DeputyToDeputyStats, stats => stats.owner, { cascade: true })
    @Field(type => [DeputyToDeputyStats])
    deputyStats: DeputyToDeputyStats[];

    @OneToMany(() => DeputyToDeputyStats, stats => stats.comparedTo)
    deputyComparisons: DeputyToDeputyStats[];

    @OneToMany(() => DeputyToFactionStats, stats => stats.deputy, { cascade: true })
    @Field(type => [DeputyToFactionStats])
    factionStats: DeputyToFactionStats[];

    @ManyToMany(() => AttendanceRegistration, registration => registration.attendees)
    attendedRegistrations: AttendanceRegistration[];

    @ManyToMany(() => AttendanceRegistration, registration => registration.absentees)
    missedRegistrations: AttendanceRegistration[];

    @ManyToMany(() => Motion, motion => motion.submitters)
    @Field(type => [Motion])
    submittedMotions: Motion[];
}

export default Deputy;