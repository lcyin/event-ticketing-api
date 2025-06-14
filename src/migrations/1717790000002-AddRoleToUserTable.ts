import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToUserTable1717790000002 implements MigrationInterface {
  name = "AddRoleToUserTable1717790000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("user");
    const roleColumnExists = table?.findColumnByName("role");

    if (!roleColumnExists) {
      await queryRunner.query(
        `ALTER TABLE "user" ADD COLUMN "role" character varying(50) NOT NULL DEFAULT 'user'`
      );
    }
    // Update existing users to have the default role if they don't have one.
    // This is more for safety if the DEFAULT constraint doesn't apply to existing NULLs immediately.
    await queryRunner.query(
      `UPDATE "user" SET "role" = 'user' WHERE "role" IS NULL`
    );
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if column exists before dropping to make 'down' idempotent
    const table = await queryRunner.getTable("user");
    if (table?.findColumnByName("role")) {
      await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role"`);
    }
  }
}
