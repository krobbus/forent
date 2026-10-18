import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';

const app = express();
const allowedOrigins = [
    'http://localhost:5173', 'https://localhost:5173',
    'http://127.0.0.1:5173', 'https://127.0.0.1:5173',
    process.env.FRONTEND_URL, process.env.BACKEND_URL
].filter(Boolean);

app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
    credentials: true
}));
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api', apiRouter);

const port = process.env.NODE_ENV === "development" ? process.env.LOCAL_SERVER_PORT : process.env.RENDER_SERVER_PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));