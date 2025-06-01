import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketTypesTable1709123456790 implements MigrationInterface {
  name = "CreateTicketTypesTable1709123456790";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "ticket_types" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "price" decimal(10,2) NOT NULL,
                "description" character varying,
                "available" integer NOT NULL,
                "max_per_order" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "event_id" uuid,
                CONSTRAINT "PK_ticket_types" PRIMARY KEY ("id"),
                CONSTRAINT "FK_ticket_types_event" FOREIGN KEY ("event_id") 
                    REFERENCES "events"("id") ON DELETE CASCADE
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ticket_types"`);
  }
}
