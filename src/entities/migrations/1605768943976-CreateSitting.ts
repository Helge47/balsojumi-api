import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateSitting1605768943976 implements MigrationInterface {
    name = 'CreateSitting1605768943976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `sitting` (`id` int NOT NULL AUTO_INCREMENT, `date` date NOT NULL, `type` varchar(255) NOT NULL, `saeimaUid` varchar(255) NOT NULL, UNIQUE INDEX `IDX_e6abde34e39d3974ef7167d322` (`saeimaUid`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_e6abde34e39d3974ef7167d322` ON `sitting`");
        await queryRunner.query("DROP TABLE `sitting`");
    }

}
