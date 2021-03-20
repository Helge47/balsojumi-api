import {MigrationInterface, QueryRunner} from "typeorm";

export class fix1616197655611 implements MigrationInterface {
    name = 'fix1616197655611'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `reading` ADD `isVotingAnonymous` tinyint NOT NULL DEFAULT 0");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `reading` DROP COLUMN `isVotingAnonymous`");
    }

}
