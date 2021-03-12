import {MigrationInterface, QueryRunner} from "typeorm";

export class IsScrapedFlag1606098336624 implements MigrationInterface {
    name = 'IsScrapedFlag1606098336624'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `sitting` ADD `isScraped` tinyint NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `proposal` ADD `isScraped` tinyint NOT NULL");
        await queryRunner.query("ALTER TABLE `vote` ADD `proposalId` int NULL");
        await queryRunner.query("ALTER TABLE `vote` ADD CONSTRAINT `FK_a6099cc53a32762d8c69e71dcd1` FOREIGN KEY (`proposalId`) REFERENCES `proposal`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `vote` DROP FOREIGN KEY `FK_a6099cc53a32762d8c69e71dcd1`");
        await queryRunner.query("ALTER TABLE `vote` DROP COLUMN `proposalId`");
        await queryRunner.query("ALTER TABLE `proposal` DROP COLUMN `isScraped`");
        await queryRunner.query("ALTER TABLE `sitting` DROP COLUMN `isScraped`");
    }

}
