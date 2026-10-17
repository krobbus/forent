import { Pool } from 'pg';

const pool = new Pool(
    process.env.NODE_ENV === 'production'
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
          }
        : {
            user: process.env.USER,
            host: 'localhost',
            database: process.env.DB,
            password: process.env.DB_PASS,
            port: process.env.DB_PORT,
          }
);

export default pool;
