import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderItemsTable1709123456794 implements MigrationInterface {
  name = "CreateOrderItemsTable1709123456794";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "order_item" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "order_id" uuid NOT NULL,
                "ticket_type_id" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "price_at_purchase" decimal(10,2) NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_order_item" PRIMARY KEY ("id"),
                CONSTRAINT "FK_order_item_order" FOREIGN KEY ("order_id")
                    REFERENCES "order"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_order_item_ticket_type" FOREIGN KEY ("ticket_type_id")
                    REFERENCES "ticket_type"("id") ON DELETE RESTRICT
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "order_item"`);
  }
}
