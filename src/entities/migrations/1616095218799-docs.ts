import {MigrationInterface, QueryRunner} from "typeorm";

export class docs1616095218799 implements MigrationInterface {
    name = 'docs1616095218799'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `motion` ADD `uid` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `motion` ADD UNIQUE INDEX `IDX_fb8d89f03c5989a87ef75c4f78` (`uid`)");
        await queryRunner.query("ALTER TABLE `motion` ADD `docs` varchar(2000) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `motion` DROP COLUMN `docs`");
        await queryRunner.query("ALTER TABLE `motion` DROP INDEX `IDX_fb8d89f03c5989a87ef75c4f78`");
        await queryRunner.query("ALTER TABLE `motion` DROP COLUMN `uid`");
    }

}
