import {MigrationInterface, QueryRunner} from "typeorm";

export class init1621715475005 implements MigrationInterface {
    name = 'init1621715475005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `deputy_record` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `surname` varchar(255) NOT NULL, `parliamentNumber` varchar(255) NOT NULL, `path` varchar(255) NOT NULL, `uid` varchar(255) NOT NULL, `deputyId` int NULL, UNIQUE INDEX `IDX_a7e97c97a00ae667d4935b7afa` (`uid`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `mandate` (`id` int NOT NULL AUTO_INCREMENT, `candidateList` varchar(255) NOT NULL, `isActive` tinyint NOT NULL, `reason` varchar(255) NOT NULL, `laidDownReason` varchar(255) NULL, `date` date NOT NULL, `laidDownDate` date NULL, `deputyId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `voting` (`id` int NOT NULL AUTO_INCREMENT, `uid` varchar(255) NOT NULL, `type` varchar(255) NOT NULL DEFAULT 'default', `method` varchar(255) NOT NULL, `isProcessed` tinyint NOT NULL DEFAULT 0, `date` datetime NULL DEFAULT NULL, `readingId` int NULL, UNIQUE INDEX `IDX_08aab36c1cb66360af2c64dc42` (`uid`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `vote` (`id` int NOT NULL AUTO_INCREMENT, `type` varchar(255) NOT NULL, `currentDeputyFaction` varchar(255) NOT NULL, `deputyId` int NOT NULL, `votingId` int NULL, UNIQUE INDEX `IDX_073c4e7e9653708180d0a83149` (`deputyId`, `votingId`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `faction_to_faction_stats` (`id` int NOT NULL AUTO_INCREMENT, `sameVotes` int NOT NULL DEFAULT '0', `oppositeVotes` int NOT NULL DEFAULT '0', `comparedToId` int NOT NULL, `ownerId` int NULL, UNIQUE INDEX `IDX_5142d1fc19e427607a6b2c59a4` (`ownerId`, `comparedToId`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `faction` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `shortName` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `deputy_to_faction_stats` (`id` int NOT NULL AUTO_INCREMENT, `popularVotes` int NOT NULL DEFAULT '0', `unpopularVotes` int NOT NULL DEFAULT '0', `deputyId` int NULL, `factionId` int NULL, UNIQUE INDEX `IDX_5dca753a8b6e31af4e36d7bee1` (`deputyId`, `factionId`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `deputy_to_deputy_stats` (`id` int NOT NULL AUTO_INCREMENT, `comparedToId` int NOT NULL, `sameVotes` int NOT NULL DEFAULT '0', `differentVotes` int NOT NULL DEFAULT '0', `supportedMotions` int NOT NULL DEFAULT '0', `abstainedMotions` int NOT NULL DEFAULT '0', `opposedMotions` int NOT NULL DEFAULT '0', `ownerId` int NULL, UNIQUE INDEX `IDX_f4d0f84a8a4aab3c53e74be143` (`ownerId`, `comparedToId`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `deputy` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `surname` varchar(255) NOT NULL, `birthYear` varchar(255) NOT NULL, `email` varchar(255) NOT NULL, `residence` varchar(255) NOT NULL, `missedSittingNumber` int NOT NULL DEFAULT '0', `attendedSittingNumber` int NOT NULL DEFAULT '0', `currentFactionId` int NULL DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `motion` (`id` int NOT NULL AUTO_INCREMENT, `uid` varchar(255) NOT NULL, `title` varchar(2000) NOT NULL, `type` varchar(255) NOT NULL, `number` varchar(255) NOT NULL, `commission` varchar(1000) NULL, `referent` varchar(500) NULL, `submittersText` varchar(2000) NULL, `docs` varchar(5000) NULL, `submissionDate` date NOT NULL, `isFinalized` tinyint NOT NULL, UNIQUE INDEX `IDX_fb8d89f03c5989a87ef75c4f78` (`uid`), UNIQUE INDEX `IDX_dd037a95789a8f55fb4d96188b` (`number`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `reading` (`id` int NOT NULL AUTO_INCREMENT, `title` varchar(255) NULL, `outcome` varchar(255) NULL, `docs` varchar(5000) NULL, `date` date NULL, `isVotingAnonymous` tinyint NOT NULL DEFAULT 0, `sittingId` int NULL, `motionId` int NULL, UNIQUE INDEX `IDX_f0ace3b3fcbb2867ce515ab4e3` (`sittingId`, `motionId`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `sitting` (`id` int NOT NULL AUTO_INCREMENT, `date` date NOT NULL, `type` varchar(255) NOT NULL, `saeimaUid` varchar(255) NOT NULL, UNIQUE INDEX `IDX_20e78ae9485b4e79fc09eabb3d` (`saeimaUid`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `attendance_registration` (`id` int NOT NULL AUTO_INCREMENT, `date` datetime NULL DEFAULT NULL, `uid` varchar(255) NOT NULL, `votingUid` varchar(255) NOT NULL, `sittingId` int NULL, UNIQUE INDEX `IDX_14fbe0cdd4e7060291ce08f822` (`uid`), UNIQUE INDEX `IDX_d10c0249a78800322b3d3a5aab` (`votingUid`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `motion_submitters` (`motionId` int NOT NULL, `deputyId` int NOT NULL, INDEX `IDX_d4572a584d70c37ec2db6ae470` (`motionId`), INDEX `IDX_016d1013d06b41437074886bb9` (`deputyId`), PRIMARY KEY (`motionId`, `deputyId`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `registration_attendees` (`attendanceRegistrationId` int NOT NULL, `deputyId` int NOT NULL, INDEX `IDX_2c05efe252f007fd57602e11e5` (`attendanceRegistrationId`), INDEX `IDX_9f5f51203cc6d82d9580ca3243` (`deputyId`), PRIMARY KEY (`attendanceRegistrationId`, `deputyId`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `registration_absentees` (`attendanceRegistrationId` int NOT NULL, `deputyId` int NOT NULL, INDEX `IDX_d5cfd50eb9be140f271440d42e` (`attendanceRegistrationId`), INDEX `IDX_5d65476f4603b7259df992ca7c` (`deputyId`), PRIMARY KEY (`attendanceRegistrationId`, `deputyId`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `deputy_record` ADD CONSTRAINT `FK_6e2b83ad98d943ffeea406234a6` FOREIGN KEY (`deputyId`) REFERENCES `deputy`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `mandate` ADD CONSTRAINT `FK_02bfae9db52b91b3abc6f12392a` FOREIGN KEY (`deputyId`) REFERENCES `deputy`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `voting` ADD CONSTRAINT `FK_5551c0f987a23e1f43c8d8b4082` FOREIGN KEY (`readingId`) REFERENCES `reading`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `vote` ADD CONSTRAINT `FK_80cf0feddbc8fbf21b072c11ba7` FOREIGN KEY (`deputyId`) REFERENCES `deputy`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `vote` ADD CONSTRAINT `FK_88ba3a68d52156f78a58a4c73d7` FOREIGN KEY (`votingId`) REFERENCES `voting`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `faction_to_faction_stats` ADD CONSTRAINT `FK_601898da07cfa5076ede8dcc380` FOREIGN KEY (`ownerId`) REFERENCES `faction`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `faction_to_faction_stats` ADD CONSTRAINT `FK_8cbe20fb5e46a8ee70ab215b450` FOREIGN KEY (`comparedToId`) REFERENCES `faction`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `deputy_to_faction_stats` ADD CONSTRAINT `FK_018dfeb6e7e533cddb86f421ec0` FOREIGN KEY (`deputyId`) REFERENCES `deputy`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `deputy_to_faction_stats` ADD CONSTRAINT `FK_627d3e8f16015470ff0d419f71c` FOREIGN KEY (`factionId`) REFERENCES `faction`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `deputy_to_deputy_stats` ADD CONSTRAINT `FK_f7d374de919e001d23487f1db38` FOREIGN KEY (`ownerId`) REFERENCES `deputy`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `deputy_to_deputy_stats` ADD CONSTRAINT `FK_800cb3991d251af3c536f8bffa8` FOREIGN KEY (`comparedToId`) REFERENCES `deputy`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `deputy` ADD CONSTRAINT `FK_cd241f716a228d1a7de048aff5d` FOREIGN KEY (`currentFactionId`) REFERENCES `faction`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `reading` ADD CONSTRAINT `FK_dc2f88840f6eb29f0cdc5f34447` FOREIGN KEY (`sittingId`) REFERENCES `sitting`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `reading` ADD CONSTRAINT `FK_f94459f883e00519681de08450a` FOREIGN KEY (`motionId`) REFERENCES `motion`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `attendance_registration` ADD CONSTRAINT `FK_9c94178e6e7bb439a05fa05567f` FOREIGN KEY (`sittingId`) REFERENCES `sitting`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `motion_submitters` ADD CONSTRAINT `FK_d4572a584d70c37ec2db6ae470c` FOREIGN KEY (`motionId`) REFERENCES `motion`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `motion_submitters` ADD CONSTRAINT `FK_016d1013d06b41437074886bb9c` FOREIGN KEY (`deputyId`) REFERENCES `deputy`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `registration_attendees` ADD CONSTRAINT `FK_2c05efe252f007fd57602e11e51` FOREIGN KEY (`attendanceRegistrationId`) REFERENCES `attendance_registration`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `registration_attendees` ADD CONSTRAINT `FK_9f5f51203cc6d82d9580ca3243d` FOREIGN KEY (`deputyId`) REFERENCES `deputy`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `registration_absentees` ADD CONSTRAINT `FK_d5cfd50eb9be140f271440d42e4` FOREIGN KEY (`attendanceRegistrationId`) REFERENCES `attendance_registration`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `registration_absentees` ADD CONSTRAINT `FK_5d65476f4603b7259df992ca7c5` FOREIGN KEY (`deputyId`) REFERENCES `deputy`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `registration_absentees` DROP FOREIGN KEY `FK_5d65476f4603b7259df992ca7c5`");
        await queryRunner.query("ALTER TABLE `registration_absentees` DROP FOREIGN KEY `FK_d5cfd50eb9be140f271440d42e4`");
        await queryRunner.query("ALTER TABLE `registration_attendees` DROP FOREIGN KEY `FK_9f5f51203cc6d82d9580ca3243d`");
        await queryRunner.query("ALTER TABLE `registration_attendees` DROP FOREIGN KEY `FK_2c05efe252f007fd57602e11e51`");
        await queryRunner.query("ALTER TABLE `motion_submitters` DROP FOREIGN KEY `FK_016d1013d06b41437074886bb9c`");
        await queryRunner.query("ALTER TABLE `motion_submitters` DROP FOREIGN KEY `FK_d4572a584d70c37ec2db6ae470c`");
        await queryRunner.query("ALTER TABLE `attendance_registration` DROP FOREIGN KEY `FK_9c94178e6e7bb439a05fa05567f`");
        await queryRunner.query("ALTER TABLE `reading` DROP FOREIGN KEY `FK_f94459f883e00519681de08450a`");
        await queryRunner.query("ALTER TABLE `reading` DROP FOREIGN KEY `FK_dc2f88840f6eb29f0cdc5f34447`");
        await queryRunner.query("ALTER TABLE `deputy` DROP FOREIGN KEY `FK_cd241f716a228d1a7de048aff5d`");
        await queryRunner.query("ALTER TABLE `deputy_to_deputy_stats` DROP FOREIGN KEY `FK_800cb3991d251af3c536f8bffa8`");
        await queryRunner.query("ALTER TABLE `deputy_to_deputy_stats` DROP FOREIGN KEY `FK_f7d374de919e001d23487f1db38`");
        await queryRunner.query("ALTER TABLE `deputy_to_faction_stats` DROP FOREIGN KEY `FK_627d3e8f16015470ff0d419f71c`");
        await queryRunner.query("ALTER TABLE `deputy_to_faction_stats` DROP FOREIGN KEY `FK_018dfeb6e7e533cddb86f421ec0`");
        await queryRunner.query("ALTER TABLE `faction_to_faction_stats` DROP FOREIGN KEY `FK_8cbe20fb5e46a8ee70ab215b450`");
        await queryRunner.query("ALTER TABLE `faction_to_faction_stats` DROP FOREIGN KEY `FK_601898da07cfa5076ede8dcc380`");
        await queryRunner.query("ALTER TABLE `vote` DROP FOREIGN KEY `FK_88ba3a68d52156f78a58a4c73d7`");
        await queryRunner.query("ALTER TABLE `vote` DROP FOREIGN KEY `FK_80cf0feddbc8fbf21b072c11ba7`");
        await queryRunner.query("ALTER TABLE `voting` DROP FOREIGN KEY `FK_5551c0f987a23e1f43c8d8b4082`");
        await queryRunner.query("ALTER TABLE `mandate` DROP FOREIGN KEY `FK_02bfae9db52b91b3abc6f12392a`");
        await queryRunner.query("ALTER TABLE `deputy_record` DROP FOREIGN KEY `FK_6e2b83ad98d943ffeea406234a6`");
        await queryRunner.query("DROP INDEX `IDX_5d65476f4603b7259df992ca7c` ON `registration_absentees`");
        await queryRunner.query("DROP INDEX `IDX_d5cfd50eb9be140f271440d42e` ON `registration_absentees`");
        await queryRunner.query("DROP TABLE `registration_absentees`");
        await queryRunner.query("DROP INDEX `IDX_9f5f51203cc6d82d9580ca3243` ON `registration_attendees`");
        await queryRunner.query("DROP INDEX `IDX_2c05efe252f007fd57602e11e5` ON `registration_attendees`");
        await queryRunner.query("DROP TABLE `registration_attendees`");
        await queryRunner.query("DROP INDEX `IDX_016d1013d06b41437074886bb9` ON `motion_submitters`");
        await queryRunner.query("DROP INDEX `IDX_d4572a584d70c37ec2db6ae470` ON `motion_submitters`");
        await queryRunner.query("DROP TABLE `motion_submitters`");
        await queryRunner.query("DROP INDEX `IDX_d10c0249a78800322b3d3a5aab` ON `attendance_registration`");
        await queryRunner.query("DROP INDEX `IDX_14fbe0cdd4e7060291ce08f822` ON `attendance_registration`");
        await queryRunner.query("DROP TABLE `attendance_registration`");
        await queryRunner.query("DROP INDEX `IDX_20e78ae9485b4e79fc09eabb3d` ON `sitting`");
        await queryRunner.query("DROP TABLE `sitting`");
        await queryRunner.query("DROP INDEX `IDX_f0ace3b3fcbb2867ce515ab4e3` ON `reading`");
        await queryRunner.query("DROP TABLE `reading`");
        await queryRunner.query("DROP INDEX `IDX_dd037a95789a8f55fb4d96188b` ON `motion`");
        await queryRunner.query("DROP INDEX `IDX_fb8d89f03c5989a87ef75c4f78` ON `motion`");
        await queryRunner.query("DROP TABLE `motion`");
        await queryRunner.query("DROP TABLE `deputy`");
        await queryRunner.query("DROP INDEX `IDX_f4d0f84a8a4aab3c53e74be143` ON `deputy_to_deputy_stats`");
        await queryRunner.query("DROP TABLE `deputy_to_deputy_stats`");
        await queryRunner.query("DROP INDEX `IDX_5dca753a8b6e31af4e36d7bee1` ON `deputy_to_faction_stats`");
        await queryRunner.query("DROP TABLE `deputy_to_faction_stats`");
        await queryRunner.query("DROP TABLE `faction`");
        await queryRunner.query("DROP INDEX `IDX_5142d1fc19e427607a6b2c59a4` ON `faction_to_faction_stats`");
        await queryRunner.query("DROP TABLE `faction_to_faction_stats`");
        await queryRunner.query("DROP INDEX `IDX_073c4e7e9653708180d0a83149` ON `vote`");
        await queryRunner.query("DROP TABLE `vote`");
        await queryRunner.query("DROP INDEX `IDX_08aab36c1cb66360af2c64dc42` ON `voting`");
        await queryRunner.query("DROP TABLE `voting`");
        await queryRunner.query("DROP TABLE `mandate`");
        await queryRunner.query("DROP INDEX `IDX_a7e97c97a00ae667d4935b7afa` ON `deputy_record`");
        await queryRunner.query("DROP TABLE `deputy_record`");
    }

}
