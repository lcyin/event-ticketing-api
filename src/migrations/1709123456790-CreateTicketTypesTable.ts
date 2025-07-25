import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketTypesTable1709123456790 implements MigrationInterface {
  name = "CreateTicketTypesTable1709123456790";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    CREATE TABLE "ticket_type" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "event_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "price" integer NOT NULL,
        "description" character varying,
        "quantity" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ticket_type" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ticket_type_event" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE
      )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ticket_type"`);
  }
}
