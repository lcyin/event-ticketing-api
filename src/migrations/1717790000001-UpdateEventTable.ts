import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEventTable1717790000001 implements MigrationInterface {
  name = "UpdateEventTable1717790000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old 'image' column if it exists
    // Adding a check because it might have been removed by synchronize:true in dev
    const table = await queryRunner.getTable("event");
    if (table?.findColumnByName("image")) {
      await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "image"`);
    }

    // Make image_url NOT NULL
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "image_url" SET NOT NULL`
    );

    // Make categories NOT NULL
    // The type text[] is already appropriate for simple-array of strings
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "categories" SET NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert categories to allow NULL
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "categories" DROP NOT NULL`
    );
    // Revert image_url to allow NULL
    await queryRunner.query(
      `ALTER TABLE "event" ALTER COLUMN "image_url" DROP NOT NULL`
    );
    // Add back the 'image' column as nullable string (VARCHAR)
    await queryRunner.query(
      `ALTER TABLE "event" ADD COLUMN "image" character varying`
    );
  }
}
