import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import merchantRoutes from './routes/merchantRoutes';
import merchantEventRoutes from "./routes/merchantEventRoutes";
import ticketRoutes from './routes/ticketRoutes';
import orderRoutes from './routes/orderRoutes';
// import refundRoutes from './routes/refundRoutes';

import { errorHandler } from './middleware/errorHandler';

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/ping', (_req: Request, res: Response) => res.send('✅ Tickify API running'));

// API routes
app.use('/api/users', userRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/uploads', express.static('uploads'));
app.use("/api/merchant", merchantEventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/orders', orderRoutes);
// app.use('/api/refunds', refundRoutes);


// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

export default app;
