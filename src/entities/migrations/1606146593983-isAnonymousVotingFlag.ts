import {MigrationInterface, QueryRunner} from "typeorm";

export class isAnonymousVotingFlag1606146593983 implements MigrationInterface {
    name = 'isAnonymousVotingFlag1606146593983'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `proposal` ADD `isAnonymous` tinyint NOT NULL DEFAULT 0");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `proposal` DROP COLUMN `isAnonymous`");
    }

}
