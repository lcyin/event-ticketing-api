import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventsTable1709123456789 implements MigrationInterface {
  name = "CreateEventsTable1709123456789";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" character varying,
                "long_description" character varying,
                "date" character varying NOT NULL,
                "start_time" character varying,
                "end_time" character varying,
                "venue" character varying NOT NULL,
                "location" character varying NOT NULL,
                "address" character varying,
                "organizer" character varying,
                "image" character varying NOT NULL,
                "image_url" character varying,
                "price_range" character varying NOT NULL,
                "category" character varying NOT NULL,
                "categories" text[],
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_events" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "events"`);
  }
}
