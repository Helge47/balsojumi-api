import {MigrationInterface, QueryRunner} from "typeorm";

export class VoteUniqueIndex1606098879419 implements MigrationInterface {
    name = 'VoteUniqueIndex1606098879419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_08e51285c958ac63b3031d59e9` ON `vote` (`deputyId`, `proposalId`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_08e51285c958ac63b3031d59e9` ON `vote`");
    }

}
