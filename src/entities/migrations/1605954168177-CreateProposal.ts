import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateProposal1605954168177 implements MigrationInterface {
    name = 'CreateProposal1605954168177'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `proposal` (`id` int NOT NULL AUTO_INCREMENT, `title` varchar(255) NOT NULL, `saeimaUid` varchar(255) NOT NULL, `lawProjectNumber` varchar(255) NULL, `votingUid` varchar(255) NULL, `commission` varchar(255) NULL, `outcome` varchar(255) NOT NULL, `meetingId` int NULL, UNIQUE INDEX `IDX_c3eb73008365aab4b96fb98249` (`saeimaUid`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `voting` (`id` int NOT NULL AUTO_INCREMENT, `title` varchar(255) NOT NULL, `lawProjectNumber` varchar(255) NULL, `saeimaUid` varchar(255) NOT NULL, `outcome` varchar(255) NOT NULL, UNIQUE INDEX `IDX_ca65a369b79c3a8e39443d3e1c` (`saeimaUid`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `proposal` ADD CONSTRAINT `FK_60b7b44c89afa7aab67a99f4df2` FOREIGN KEY (`meetingId`) REFERENCES `meeting`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `proposal` DROP FOREIGN KEY `FK_60b7b44c89afa7aab67a99f4df2`");
        await queryRunner.query("DROP INDEX `IDX_ca65a369b79c3a8e39443d3e1c` ON `voting`");
        await queryRunner.query("DROP TABLE `voting`");
        await queryRunner.query("DROP INDEX `IDX_c3eb73008365aab4b96fb98249` ON `proposal`");
        await queryRunner.query("DROP TABLE `proposal`");
    }

}
