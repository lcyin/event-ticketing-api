import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrdersTable1709123456792 implements MigrationInterface {
  name = "CreateOrdersTable1709123456792";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "order" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "total_amount" decimal(10,2) NOT NULL,
                "status" character varying NOT NULL,
                "customer_name" character varying NOT NULL,
                "customer_email" character varying NOT NULL,
                "billing_address_line1" character varying,
                "billing_address_line2" character varying,
                "billing_city" character varying,
                "billing_state" character varying,
                "billing_zip" character varying,
                "payment_method" character varying NOT NULL,
                "payment_status" character varying NOT NULL,
                "transaction_id" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_order" PRIMARY KEY ("id"),
                CONSTRAINT "FK_order_user" FOREIGN KEY ("user_id")
                    REFERENCES "user"("id") ON DELETE RESTRICT
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order"`);
  }
}
