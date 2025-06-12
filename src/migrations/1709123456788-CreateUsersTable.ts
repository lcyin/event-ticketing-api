import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1709123456788 implements MigrationInterface {
  name = "CreateUsersTable1709123456788";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "user" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying UNIQUE NOT NULL, -- Kept as is, standard practice
                "passwordHash" character varying NOT NULL,
                "firstName" character varying,
                "lastName" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
