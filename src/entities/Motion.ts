import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Reading from './Reading';

type MotionType = 'Bill' | 'Decision' | 'Request' | 'Inquiry';

@Entity()
@ObjectType()
class Motion extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column({ unique: true })
    @Field()
    uid: string;

    @Column('varchar', { length: 2000 })
    @Field()
    title: string;

    @Column()
    @Field()
    type: MotionType;

    @Column({ unique: true })
    @Field()
    number: string;

    @Column('varchar', { length: 1000, nullable: true })
    @Field()
    commission: string;

    @Column('varchar', { length: 500, nullable: true })
    @Field()
    referent: string;

    @Column('varchar', { length: 2000, nullable: true })
    @Field()
    submitters: string;

    @Column('varchar', { length: 2000, nullable: true })
    @Field()
    docs: string;

    @Column('date')
    @Field()
    submissionDate: Date;

    @OneToMany(() => Reading, reading => reading.motion, { cascade: true })
    readings: Reading[];
}

export default Motion;