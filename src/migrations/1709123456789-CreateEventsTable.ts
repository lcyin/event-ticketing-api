import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEventsTable1709123456789 implements MigrationInterface {
  name = "CreateEventsTable1709123456789";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await queryRunner.query(`
            CREATE TABLE "event" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" character varying,
                "long_description" character varying,
                "date" DATE NOT NULL,
                "start_time" TIME WITH TIME ZONE,
                "end_time" TIME WITH TIME ZONE,
                "venue" character varying NOT NULL,
                "location" character varying NOT NULL,
                "address" character varying,
                "organizer" character varying,
                "image_url" character varying NOT NULL,
                "price_range" character varying NOT NULL,
                "categories" text[],
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_event" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "event"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp";`);
  }
}
