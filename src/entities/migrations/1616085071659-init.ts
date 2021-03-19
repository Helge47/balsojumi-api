import {MigrationInterface, QueryRunner} from "typeorm";

export class init1616085071659 implements MigrationInterface {
    name = 'init1616085071659'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `deputy_record` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `surname` varchar(255) NOT NULL, `parliamentNumber` varchar(255) NOT NULL, `path` varchar(255) NOT NULL, `uid` varchar(255) NOT NULL, `deputyId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `mandate` (`id` int NOT NULL AUTO_INCREMENT, `candidateList` varchar(255) NOT NULL, `isActive` tinyint NOT NULL, `reason` varchar(255) NOT NULL, `laidDownReason` varchar(255) NULL, `date` date NOT NULL, `laidDownDate` date NULL, `deputyId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `motion` (`id` int NOT NULL AUTO_INCREMENT, `title` varchar(2000) NOT NULL, `type` varchar(255) NOT NULL, `number` varchar(255) NOT NULL, `commission` varchar(1000) NULL, `submissionDate` date NOT NULL, UNIQUE INDEX `IDX_dd037a95789a8f55fb4d96188b` (`number`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `sitting` (`id` int NOT NULL AUTO_INCREMENT, `date` date NOT NULL, `type` varchar(255) NOT NULL, `saeimaUid` varchar(255) NOT NULL, `isScraped` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX `IDX_20e78ae9485b4e79fc09eabb3d` (`saeimaUid`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `reading` (`id` int NOT NULL AUTO_INCREMENT, `title` varchar(255) NULL, `outcome` varchar(255) NULL, `docs` varchar(1000) NULL, `date` date NOT NULL, `sittingId` int NULL, `motionId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `vote` (`id` int NOT NULL AUTO_INCREMENT, `type` varchar(255) NOT NULL, `deputyId` int NULL, `readingId` int NULL, UNIQUE INDEX `IDX_2727cd25be77c91cb55c2f3533` (`deputyId`, `readingId`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `deputy` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `surname` varchar(255) NOT NULL, `currentFaction` varchar(255) NOT NULL, `birthYear` varchar(255) NOT NULL, `email` varchar(255) NOT NULL, `residence` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `deputy_record` ADD CONSTRAINT `FK_6e2b83ad98d943ffeea406234a6` FOREIGN KEY (`deputyId`) REFERENCES `deputy`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `mandate` ADD CONSTRAINT `FK_02bfae9db52b91b3abc6f12392a` FOREIGN KEY (`deputyId`) REFERENCES `deputy`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `reading` ADD CONSTRAINT `FK_dc2f88840f6eb29f0cdc5f34447` FOREIGN KEY (`sittingId`) REFERENCES `sitting`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `reading` ADD CONSTRAINT `FK_f94459f883e00519681de08450a` FOREIGN KEY (`motionId`) REFERENCES `motion`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `vote` ADD CONSTRAINT `FK_80cf0feddbc8fbf21b072c11ba7` FOREIGN KEY (`deputyId`) REFERENCES `deputy`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `vote` ADD CONSTRAINT `FK_ffa4cb0a6786ce751976aa6abcc` FOREIGN KEY (`readingId`) REFERENCES `reading`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `vote` DROP FOREIGN KEY `FK_ffa4cb0a6786ce751976aa6abcc`");
        await queryRunner.query("ALTER TABLE `vote` DROP FOREIGN KEY `FK_80cf0feddbc8fbf21b072c11ba7`");
        await queryRunner.query("ALTER TABLE `reading` DROP FOREIGN KEY `FK_f94459f883e00519681de08450a`");
        await queryRunner.query("ALTER TABLE `reading` DROP FOREIGN KEY `FK_dc2f88840f6eb29f0cdc5f34447`");
        await queryRunner.query("ALTER TABLE `mandate` DROP FOREIGN KEY `FK_02bfae9db52b91b3abc6f12392a`");
        await queryRunner.query("ALTER TABLE `deputy_record` DROP FOREIGN KEY `FK_6e2b83ad98d943ffeea406234a6`");
        await queryRunner.query("DROP TABLE `deputy`");
        await queryRunner.query("DROP INDEX `IDX_2727cd25be77c91cb55c2f3533` ON `vote`");
        await queryRunner.query("DROP TABLE `vote`");
        await queryRunner.query("DROP TABLE `reading`");
        await queryRunner.query("DROP INDEX `IDX_20e78ae9485b4e79fc09eabb3d` ON `sitting`");
        await queryRunner.query("DROP TABLE `sitting`");
        await queryRunner.query("DROP INDEX `IDX_dd037a95789a8f55fb4d96188b` ON `motion`");
        await queryRunner.query("DROP TABLE `motion`");
        await queryRunner.query("DROP TABLE `mandate`");
        await queryRunner.query("DROP TABLE `deputy_record`");
    }

}
