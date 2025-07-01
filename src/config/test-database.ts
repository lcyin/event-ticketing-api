import { DataSource } from "typeorm";
import { Event } from "../entities/Event";
import { TicketType } from "../entities/TicketType";
import { FAQ } from "../entities/FAQ";
import { Order } from "../entities/Order";
import { User } from "../entities/User";
import dotenv from "dotenv";
import { OrderItem } from "../entities/OrderItem";

dotenv.config();

export const TestDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "event_ticketing_test",
  synchronize: true, // Always synchronize for tests
  logging: false, // Disable logging for tests
  entities: ["src/entities/*.ts"],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
});
