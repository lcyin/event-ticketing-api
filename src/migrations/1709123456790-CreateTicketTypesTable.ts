import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketTypesTable1709123456790 implements MigrationInterface {
  name = "CreateTicketTypesTable1709123456790";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "ticket_type" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "price" decimal(10,2) NOT NULL,
                "description" character varying,
                "available" integer NOT NULL,
                "max_per_order" integer,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "event_id" uuid,
                CONSTRAINT "PK_ticket_type" PRIMARY KEY ("id"),
                CONSTRAINT "FK_ticket_type_event" FOREIGN KEY ("event_id") 
                    REFERENCES "event"("id") ON DELETE CASCADE
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ticket_type"`);
  }
}
