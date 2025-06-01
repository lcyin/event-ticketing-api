import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFAQsTable1709123456791 implements MigrationInterface {
  name = "CreateFAQsTable1709123456791";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "faq" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "question" character varying NOT NULL,
                "answer" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "event_id" uuid,
                CONSTRAINT "PK_faq" PRIMARY KEY ("id"),
                CONSTRAINT "FK_faq_event" FOREIGN KEY ("event_id") 
                    REFERENCES "event"("id") ON DELETE CASCADE
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "faq"`);
  }
}
