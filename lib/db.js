import { Pool } from 'pg';
import { Sequelize } from 'sequelize';

const DATABASE_URL = process.env.DATABASE_URL 

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
      require: true,
    rejectUnauthorized: false, 
  },
});

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

(async () => {
  try {
    await sequelize.authenticate();
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();



