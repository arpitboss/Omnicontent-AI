// packages/backend/src/index.ts
// Initialize Sentry before any other import so it can auto-instrument http/express/mongoose.
import './instrument';
import * as Sentry from '@sentry/node';
import crypto from 'crypto';
import http from 'http';
import { Server } from 'socket.io';
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';
import contentRoutes from './routes/contentRoutes';
import publishRoutes from './routes/publishRoutes';
import billingRoutes, { stripeWebhookHandler } from './routes/billingRoutes';
import voiceRoutes from './routes/voiceRoutes';
import { clerkMiddleware } from '@clerk/express';
import { apiLimiter } from './middleware/rateLimit';
import { startScheduler } from './utils/scheduler';

dotenv.config();
connectDB();

const app = express();

// Render/Vercel serve the app behind a reverse proxy. Trust the first proxy hop
// so req.ip reflects the real client — required for correct rate-limit keying.
app.set('trust proxy', 1);

const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const allowedOrigins = [
    FRONTEND_URL,
    "http://localhost:3000",
];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        // Allow exact matches from the allowed list
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Allow any Vercel preview deployment (*.vercel.app)
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(server, { cors: corsOptions });
const PORT = process.env.PORT || 8080;
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || '';

if (!INTERNAL_API_SECRET) {
    console.warn('[⚠️ SECURITY] INTERNAL_API_SECRET is not set. The /api/internal/notify endpoint is unprotected!');
}

app.use(cors(corsOptions));

// Stripe webhook needs the raw body for signature verification — mount BEFORE express.json()
app.post('/api/v1/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(clerkMiddleware());

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on('join_room', (userId) => {
        console.log(`Socket ${socket.id} joining room for user ${userId}`);
        socket.join(userId);
    });
    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

app.post('/api/internal/notify', express.json(), (req, res) => {
    // Validate internal API secret (timing-safe comparison to prevent timing attacks)
    if (INTERNAL_API_SECRET) {
        const providedSecret = req.headers['x-internal-secret'] as string || '';
        const secretBuffer = Buffer.from(INTERNAL_API_SECRET);
        const providedBuffer = Buffer.from(providedSecret);

        if (secretBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(secretBuffer, providedBuffer)) {
            console.warn('[🛡️] Rejected unauthorized internal notify request.');
            return res.sendStatus(403);
        }
    }

    const { userId, downloadUrl, reformatJobId, error } = req.body;
    if (error) {
        io.to(userId).emit('reformat_failed', { reformatJobId, error });
    } else {
        io.to(userId).emit('reformat_complete', { downloadUrl, reformatJobId });
    }
    res.sendStatus(200);
});

// API routes (apiLimiter is a global safety net; expensive routes add stricter limits)
app.use('/api/v1/content', apiLimiter, contentRoutes);
app.use('/api/v1/publish', apiLimiter, publishRoutes);
app.use('/api/v1/billing', apiLimiter, billingRoutes);
app.use('/api/v1/voice', apiLimiter, voiceRoutes);

// Health check route
app.get('/', (req, res) => {
    res.send('OmniContent AI Backend is running!');
});

// Sentry error handler must be registered after all routes but before any other
// error middleware. Captures exceptions thrown in route handlers (no-op if Sentry
// is not configured) and then lets Express continue its normal handling.
Sentry.setupExpressErrorHandler(app);

// Start the daily lifecycle-email scheduler (no-op unless RESEND_API_KEY is set).
startScheduler();

server.listen(PORT, () => {
    console.log(`Server with sockets is running on http://localhost:${PORT}`);
});