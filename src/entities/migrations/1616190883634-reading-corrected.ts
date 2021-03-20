import {MigrationInterface, QueryRunner} from "typeorm";

export class readingCorrected1616190883634 implements MigrationInterface {
    name = 'readingCorrected1616190883634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `sitting` DROP COLUMN `isScraped`");
        await queryRunner.query("ALTER TABLE `reading` ADD `votingUid` varchar(255) NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `reading` DROP COLUMN `votingUid`");
        await queryRunner.query("ALTER TABLE `sitting` ADD `isScraped` tinyint NOT NULL DEFAULT '0'");
    }

}
