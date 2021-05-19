import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Deputy from './Deputy';
import DeputyToFactionStats from './DeputyToFactionStats';
import FactionToFactionStats from './FactionToFactionStats';

@Entity()
@ObjectType()
class Faction extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column()
    @Field()
    name: string;

    @Column()
    @Field()
    shortName: string;

    @Field(type => [Deputy])
    @OneToMany(() => Deputy, deputy => deputy.currentFaction)
    currentMembers: Deputy[];

    @Field(type => [FactionToFactionStats])
    @OneToMany(() => FactionToFactionStats, stats => stats.owner, { cascade: true })
    factionStats: FactionToFactionStats[];

    @OneToMany(() => FactionToFactionStats, stats => stats.comparedTo)
    factionComparisons: FactionToFactionStats[];

    @Field(type => [DeputyToFactionStats])
    @OneToMany(() => DeputyToFactionStats, stats => stats.faction)
    deputyStats: DeputyToFactionStats;
}

export default Faction;