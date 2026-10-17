const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const app = express();
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL
        : 'https://localhost:5173',
    credentials: true
}));
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

app.use((req, _res, next) => {
    req.pool = pool;
    next();
});

app.use('/api', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api', require('./routes/profile'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/payment', require('./routes/payment'));

const port = process.env.RENDER_SERVER_PORT || process.env.LOCAL_SERVER_PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));