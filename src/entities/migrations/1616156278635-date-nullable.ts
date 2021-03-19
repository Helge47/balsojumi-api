import {MigrationInterface, QueryRunner} from "typeorm";

export class dateNullable1616156278635 implements MigrationInterface {
    name = 'dateNullable1616156278635'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `reading` CHANGE `date` `date` date NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `reading` CHANGE `date` `date` date NOT NULL");
    }

}
