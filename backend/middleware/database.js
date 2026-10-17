import pool from '../database/pool.js';

export const attachDatabase = (req, _res, next) => {
    req.pool = pool;
    next();
};
