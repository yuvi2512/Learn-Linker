import { Pool } from 'pg';
import { Sequelize } from 'sequelize';

const DATABASE_URL = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';

const caCert = process.env.VERCEL_POSTGRES_CA_CERT;

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
        ca: caCert,
      }
    : false,
});

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