import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
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

    @OneToMany(() => FactionToFactionStats, stats => stats.owner, { cascade: true })
    factionStats: FactionToFactionStats[];

    @OneToMany(() => FactionToFactionStats, stats => stats.comparedTo)
    factionComparisons: FactionToFactionStats[];

    @OneToMany(() => DeputyToFactionStats, stats => stats.faction)
    deputyStats: DeputyToFactionStats;
}

export default Faction;