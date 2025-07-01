import { DataSource } from "typeorm";
import { Event } from "../entities/Event";
import { TicketType } from "../entities/TicketType";
import { FAQ } from "../entities/FAQ";
import { Order } from "../entities/Order";
import { User } from "../entities/User";
import dotenv from "dotenv";
import { OrderItem } from "../entities/OrderItem";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "event_ticketing",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: ["src/entities/*.ts"],
  migrations: ["src/migrations/*.ts"],
  subscribers: ["src/subscribers/*.ts"],
});
