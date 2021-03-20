import { Field, ID } from 'type-graphql';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Reading from './Reading';

export enum SittingType {
    DEFAULT = 'default',
    CLOSED = 'closed',
    EMERGENCY = 'emergency',
    EMERGENCY_SESSION = 'emergencySession',
    QA = 'qa',
    FORMAL = 'formal',
};

@Entity()
class Sitting extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column({ type: 'date' })
    @Field()
    date: Date;

    @Column()
    @Field()
    type: SittingType;

    @Column({ unique: true })
    @Field()
    saeimaUid: string;

    @OneToMany(() => Reading, reading => reading.sitting)
    readings: Reading[];
}

export default Sitting;