import {MigrationInterface, QueryRunner} from "typeorm";

export class referentSubmitter1616154285545 implements MigrationInterface {
    name = 'referentSubmitter1616154285545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `motion` ADD `referent` varchar(500) NULL");
        await queryRunner.query("ALTER TABLE `motion` ADD `submitters` varchar(2000) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `motion` DROP COLUMN `submitters`");
        await queryRunner.query("ALTER TABLE `motion` DROP COLUMN `referent`");
    }

}
