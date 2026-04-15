// packages/backend/src/index.ts
import http from 'http';
import { Server } from 'socket.io';
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';
import contentRoutes from './routes/contentRoutes';
import { clerkMiddleware } from '@clerk/express';
// import billingRoutes from './routes/billingRoutes';

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const io = new Server(server, { cors: { origin: FRONTEND_URL } });
const PORT = process.env.PORT || 8080;

app.use(cors({
    origin: FRONTEND_URL, // Allow frontend origin
    credentials: true,
}));
app.use(express.json());
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
    const { userId, downloadUrl, reformatJobId, error } = req.body;
    if (error) {
        io.to(userId).emit('reformat_failed', { reformatJobId, error });
    } else {
        io.to(userId).emit('reformat_complete', { downloadUrl, reformatJobId });
    }
    res.sendStatus(200);
});

// API routes
app.use('/api/v1/content', contentRoutes);
// app.use('/api/v1/billing', billingRoutes);

// Health check route
app.get('/', (req, res) => {
    res.send('OmniContent AI Backend is running!');
});

server.listen(PORT, () => {
    console.log(`Server with sockets is running on http://localhost:${PORT}`);
});