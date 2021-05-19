import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Faction from './Faction';

@Entity()
@ObjectType()
@Index(['owner', 'comparedTo'], { unique: true })
class FactionToFactionStats extends BaseEntity {

    @PrimaryGeneratedColumn()
    @Field(type => ID)
    id: number;

    @Column('int', { default: 0 })
    @Field()
    sameVotes: number;
    
    @Column('int', { default: 0 })
    @Field()
    oppositeVotes: number;

    @ManyToOne(() => Faction, faction => faction.factionStats)
    owner: Faction;

    @ManyToOne(() => Faction, faction => faction.factionComparisons)
    comparedTo: Faction; 
}

export default FactionToFactionStats;