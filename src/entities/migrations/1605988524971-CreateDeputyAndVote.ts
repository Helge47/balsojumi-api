import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateDeputyAndVote1605988524971 implements MigrationInterface {
    name = 'CreateDeputyAndVote1605988524971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `vote` (`id` int NOT NULL AUTO_INCREMENT, `type` varchar(255) NOT NULL, `deputyId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `deputy` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `party` varchar(255) NOT NULL, UNIQUE INDEX `IDX_e5018abb67a6c1dfaf16d6c8de` (`name`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `vote` ADD CONSTRAINT `FK_80cf0feddbc8fbf21b072c11ba7` FOREIGN KEY (`deputyId`) REFERENCES `deputy`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `vote` DROP FOREIGN KEY `FK_80cf0feddbc8fbf21b072c11ba7`");
        await queryRunner.query("DROP INDEX `IDX_e5018abb67a6c1dfaf16d6c8de` ON `deputy`");
        await queryRunner.query("DROP TABLE `deputy`");
        await queryRunner.query("DROP TABLE `vote`");
    }

}
