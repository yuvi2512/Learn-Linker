import { Pool } from 'pg';
import { Sequelize } from 'sequelize';

export const pool = new Pool({
  user: "postgres",  // replace with your username if different
  host: "ballast.proxy.rlwy.net",  // Railway host
  database: "postgres",  // replace with your database name if different
  password: "CrNQlkVPtFENYMuYWOvyIaBwvvGwCrGh",  // replace with your Railway password
  port: 32382,  // Railway port
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



