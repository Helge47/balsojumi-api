import { Field, ID, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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

    @Column()
    @Field()
    comparedToId: number;

    @ManyToOne(() => Faction, faction => faction.factionComparisons)
    @JoinColumn()
    comparedTo: Faction; 
}

export default FactionToFactionStats;