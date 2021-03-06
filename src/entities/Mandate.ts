import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Deputy from './Deputy';

@Entity()
@ObjectType()
class Mandate extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column()
    @Field()
    candidateList: string;

    @Column()
    @Field()
    isActive: boolean;

    @Column()
    @Field()
    reason: string;

    @Column({ nullable: true })
    @Field({ nullable: true })
    laidDownReason: string;

    @Column({ type: 'date' })
    @Field()
    date: string;

    @Column({ type: 'date', nullable: true })
    @Field({ nullable: true })
    laidDownDate: string;

    @ManyToOne(() => Deputy, (deputy) => deputy.mandates)
    deputy: Deputy;
}

export default Mandate;