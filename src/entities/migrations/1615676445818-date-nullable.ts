import {MigrationInterface, QueryRunner} from "typeorm";

export class dateNullable1615676445818 implements MigrationInterface {
    name = 'dateNullable1615676445818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `mandate` CHANGE `date` `date` datetime NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `mandate` CHANGE `date` `date` datetime NOT NULL");
    }

}
