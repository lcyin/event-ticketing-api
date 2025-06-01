import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrdersTable1709123456792 implements MigrationInterface {
  name = "CreateOrdersTable1709123456792";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "order" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" character varying NOT NULL,
                "event_name" character varying NOT NULL,
                "event_date" character varying NOT NULL,
                "event_location" character varying NOT NULL,
                "tickets" jsonb NOT NULL,
                "customer_info" jsonb NOT NULL,
                "billing_address" jsonb NOT NULL,
                "payment_info" jsonb NOT NULL,
                "total_amount" decimal(10,2) NOT NULL,
                "status" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_order" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order"`);
  }
}
