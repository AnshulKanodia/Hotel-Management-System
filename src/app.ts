import express, { Application, Request, Response } from 'express';

// ─── Route Imports ─────────────────────────────────────────
import departmentRoutes from './routes/departmentRoutes';
import customerRoutes from './routes/customerRoutes';
import staffRoutes from './routes/staffRoutes';
import roomRoutes from './routes/roomRoutes';
import bookingRoutes from './routes/bookingRoutes';
import reportRoutes from './routes/reportRoutes';

// ─── Middleware Imports ────────────────────────────────────
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

const app: Application = express();

// ─── Body Parsers ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ──────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api/departments', departmentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reports', reportRoutes);

// ─── 404 Handler ──────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ──────────────────────────────────
app.use(errorHandler);

export default app;
