import { Pool } from 'pg';
import { Sequelize } from 'sequelize';

const DATABASE_URL = process.env.DATABASE_URL;

const isProduction = process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

export const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: isProduction ? { ssl: { require: true, rejectUnauthorized: false } } : {},
  logging: false,
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();
