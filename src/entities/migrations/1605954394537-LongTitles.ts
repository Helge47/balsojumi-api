import {MigrationInterface, QueryRunner} from "typeorm";

export class LongTitles1605954394537 implements MigrationInterface {
    name = 'LongTitles1605954394537'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `proposal` DROP COLUMN `title`");
        await queryRunner.query("ALTER TABLE `proposal` ADD `title` varchar(2000) NOT NULL");
        await queryRunner.query("ALTER TABLE `proposal` DROP COLUMN `commission`");
        await queryRunner.query("ALTER TABLE `proposal` ADD `commission` varchar(1000) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `proposal` DROP COLUMN `commission`");
        await queryRunner.query("ALTER TABLE `proposal` ADD `commission` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `proposal` DROP COLUMN `title`");
        await queryRunner.query("ALTER TABLE `proposal` ADD `title` varchar(255) NOT NULL");
    }

}
