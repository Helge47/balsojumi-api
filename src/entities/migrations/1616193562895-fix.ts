import {MigrationInterface, QueryRunner} from "typeorm";

export class fix1616193562895 implements MigrationInterface {
    name = 'fix1616193562895'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `reading` CHANGE `votingUid` `votingUid` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `reading` CHANGE `votingUid` `votingUid` varchar(255) NOT NULL");
    }

}
