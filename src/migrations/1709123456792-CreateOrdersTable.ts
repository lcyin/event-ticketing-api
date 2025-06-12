import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrdersTable1709123456792 implements MigrationInterface {
  name = "CreateOrdersTable1709123456792";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "order" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "totalAmount" decimal(10,2) NOT NULL,
                "status" character varying NOT NULL,
                "customerName" character varying NOT NULL,
                "customerEmail" character varying NOT NULL,
                "billingAddressLine1" character varying,
                "billingAddressLine2" character varying,
                "billingCity" character varying,
                "billingState" character varying,
                "billingZip" character varying,
                "paymentMethod" character varying NOT NULL,
                "paymentStatus" character varying NOT NULL,
                "transactionId" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_order" PRIMARY KEY ("id"),
                CONSTRAINT "FK_order_user" FOREIGN KEY ("userId")
                    REFERENCES "user"("id") ON DELETE RESTRICT
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order"`);
  }
}
