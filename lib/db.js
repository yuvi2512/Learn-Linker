import { Pool } from "pg";
import { Sequelize } from "sequelize";
import runtimeConfig from "./runtimeConfig";

const DATABASE_URL = runtimeConfig.resolveDatabaseUrl();
const ssl = runtimeConfig.sslConfig(DATABASE_URL);
const onVercel = Boolean(process.env.VERCEL);

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Falling back to local Postgres at localhost:5432/learnlinker."
  );
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl,
  // Serverless functions should not hold a large idle pool.
  max: onVercel ? 3 : 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 15_000,
});

export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: ssl ? { ssl } : {},
  logging: false,
  pool: {
    max: onVercel ? 3 : 5,
    min: 0,
    idle: 10_000,
    acquire: 15_000,
  },
});
