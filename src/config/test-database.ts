import { DataSource } from "typeorm";
import { Event } from "../entities/Event";
import { TicketType } from "../entities/TicketType";
import { FAQ } from "../entities/FAQ";
import { Order } from "../entities/Order";
import { User } from "../entities/User";
import dotenv from "dotenv";

dotenv.config();

export const TestDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.TEST_DB_NAME || "event_ticketing_test",
  synchronize: true, // Always synchronize for tests
  logging: false, // Disable logging for tests
  entities: [Event, TicketType, FAQ, Order, User],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
});
