import { Pool } from "pg";
import { Sequelize } from "sequelize";

const DATABASE_URL = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production";

const caCert = process.env.VERCEL_POSTGRES_CA_CERT;

if (!DATABASE_URL) {
  console.warn(
    "DATABASE_URL is not set. Database queries will fail until it is configured."
  );
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
        ca: caCert,
      }
    : false,
});

// Fall back to a placeholder so importing this module never throws: the app
// should still boot (and return clean 401s) when the database is unconfigured.
export const sequelize = new Sequelize(
  DATABASE_URL || "postgres://user:pass@localhost:5432/postgres",
  {
    dialect: "postgres",
    dialectOptions: isProduction
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
            ca: caCert,
          },
        }
      : {},
    logging: false,
  }
);
