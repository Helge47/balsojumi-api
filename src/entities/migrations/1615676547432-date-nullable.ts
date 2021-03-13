import {MigrationInterface, QueryRunner} from "typeorm";

export class dateNullable1615676547432 implements MigrationInterface {
    name = 'dateNullable1615676547432'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `mandate` CHANGE `date` `date` datetime NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `mandate` CHANGE `date` `date` datetime NULL");
    }

}
