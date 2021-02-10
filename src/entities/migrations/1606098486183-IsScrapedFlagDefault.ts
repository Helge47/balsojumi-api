import {MigrationInterface, QueryRunner} from "typeorm";

export class IsScrapedFlagDefault1606098486183 implements MigrationInterface {
    name = 'IsScrapedFlagDefault1606098486183'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `proposal` CHANGE `isScraped` `isScraped` tinyint NOT NULL DEFAULT 0");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `proposal` CHANGE `isScraped` `isScraped` tinyint NOT NULL");
    }

}
