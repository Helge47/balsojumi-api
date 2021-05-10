import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, Index, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import Deputy from './Deputy';
import Faction from './Faction';

@Entity()
@Index(['deputy', 'faction'], { unique: true })
@ObjectType()
class DeputyToFactionStats extends BaseEntity {

    static make(deputy: Deputy, faction: Faction) {
        const deputyFactionEntry = new DeputyToFactionStats();
        deputyFactionEntry.deputy = deputy;
        deputyFactionEntry.faction = faction;
        deputyFactionEntry.popularVotes = 0;
        deputyFactionEntry.unpopularVotes = 0;

        return deputyFactionEntry;
    }

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @ManyToOne(() => Deputy, deputy => deputy.factionStats)
    deputy: Deputy;

    @ManyToOne(() => Faction, faction => faction.deputyStats)
    faction: Faction;

    @Column()
    @Field()
    popularVotes: number;

    @Column()
    @Field()
    unpopularVotes: number;
}

export default DeputyToFactionStats;