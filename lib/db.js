import { Pool } from 'pg';
import { Sequelize } from 'sequelize';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

// Read the CA certificate if in production
const caCert = isProduction ? fs.readFileSync(process.env.VERCEL_POSTGRES_CA_CERT).toString() : undefined;

// Pool (pg)
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
        ca: caCert,
      }
    : false,
});

// Sequelize
export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
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
});

