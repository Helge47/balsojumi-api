import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, Index, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import Deputy from './Deputy';
import Faction from './Faction';

@Entity()
@Index(['deputy', 'faction'], { unique: true })
@ObjectType()
class DeputyToFactionStats extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @ManyToOne(() => Deputy, deputy => deputy.factionStats)
    deputy: Deputy;

    @ManyToOne(() => Faction, faction => faction.deputyStats)
    faction: Faction;

    @Column({ default: 0 })
    @Field()
    popularVotes: number;

    @Column({ default: 0 })
    @Field()
    unpopularVotes: number;
}

export default DeputyToFactionStats;