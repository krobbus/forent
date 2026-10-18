import { Pool } from 'pg';

const pool = new Pool(
  process.env.NODE_ENV === 'development' ? {
    user: process.env.USER,
    host: 'localhost',
    database: process.env.DB,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
  } : {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  }
);

export const attachDatabase = (req, _res, next) => {
  req.pool = pool;
  next();
};