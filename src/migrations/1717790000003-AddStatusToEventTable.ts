import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToEventTable1717790000003 implements MigrationInterface {
  name = "AddStatusToEventTable1717790000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("event");
    const statusColumnExists = table?.findColumnByName("status");

    if (!statusColumnExists) {
      await queryRunner.query(
        `ALTER TABLE "event" ADD COLUMN "status" character varying(50) NOT NULL DEFAULT 'draft'`
      );
    }
    await queryRunner.query(
      `UPDATE "event" SET "status" = 'draft' WHERE "status" IS NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "status"`);
  }
}
