import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';

const app = express();
const allowedOrigins = [
    'http://localhost:5173', 'https://localhost:5173',
    'http://127.0.0.1:5173', 'https://127.0.0.1:5173',
    'https://forent-rental.vercel.app',
    process.env.FRONTEND_URL,
    process.env.BACKEND_URL
].filter(Boolean).map(url => url.replace(/\/+$/, ''));

const pattern = /^forent(-[a-z0-9-]+)?-krobbus-projects\.vercel\.app$/;

const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    if (allowedOrigins.includes(origin)) return true;

    try {
        const { protocol, hostname } = new URL(origin);
        return protocol === 'https:' && pattern.test(hostname);
    } catch {
        return false;
    }
};

app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api', apiRouter);

const port = process.env.NODE_ENV === "development" ? process.env.LOCAL_SERVER_PORT : process.env.RENDER_SERVER_PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));