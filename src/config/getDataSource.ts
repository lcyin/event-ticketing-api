import { DataSource } from "typeorm";
import { AppDataSource } from "./database";
import { TestDataSource } from "./test-database";

export const getDataSource = (): DataSource => {
  return process.env.NODE_ENV === "test" ? TestDataSource : AppDataSource;
};
