import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import cron from 'node-cron';
import authRoutes from './routes/auth';
import matchesRoutes from './routes/matches';
import predictionsRoutes from './routes/predictions';
import leaderboardRoutes from './routes/leaderboard';
import { evaluatePredictions } from './services/cron';

dotenv.config();

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

import usersRoutes from './routes/users';
import path from 'path';

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Serve uploads directory statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Basic Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SWC API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', usersRoutes);

// Socket.IO
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Run evaluation every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('Running 5-minute cron job for prediction evaluation...');
  await evaluatePredictions();
});

// Trigger immediately on startup to sync data from the new API
setTimeout(() => {
  console.log('Running initial API sync on startup...');
  evaluatePredictions();
}, 2000);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
