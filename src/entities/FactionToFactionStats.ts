import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import Faction from './Faction';

@Entity()
@ObjectType()
class FactionToFactionStats extends BaseEntity {

    static make(owner: Faction, comparedTo: Faction) {
        const stats = new FactionToFactionStats();
        stats.owner = owner;
        stats.comparedTo = comparedTo;
        stats.sameVotes = 0;
        stats.oppositeVotes = 0;

        return stats;
    }

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column('int')
    @Field()
    sameVotes: number;
    
    @Column('int')
    @Field()
    oppositeVotes: number;

    @ManyToOne(() => Faction, faction => faction.factionStats)
    owner: Faction;

    @ManyToOne(() => Faction, faction => faction.factionComparisons)
    comparedTo: Faction;
}

export default FactionToFactionStats;