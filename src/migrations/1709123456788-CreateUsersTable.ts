import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1709123456788 implements MigrationInterface {
  name = "CreateUsersTable1709123456788";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "user" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying UNIQUE NOT NULL,
                "password_hash" character varying NOT NULL,
                "first_name" character varying,
                "last_name" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
