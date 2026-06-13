import path from 'path';
import express, { Application, Request, Response, NextFunction } from 'express';

// ─── Route Imports ─────────────────────────────────────────
import departmentRoutes from './routes/departmentRoutes';
import customerRoutes from './routes/customerRoutes';
import staffRoutes from './routes/staffRoutes';
import roomRoutes from './routes/roomRoutes';
import bookingRoutes from './routes/bookingRoutes';
import reportRoutes from './routes/reportRoutes';
import adminRoutes from './routes/adminRoutes';

// ─── Middleware Imports ────────────────────────────────────
import { notFound } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { adminAuth } from './middlewares/adminAuth';

const app: Application = express();

// ─── Body Parsers ──────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files (Admin Panel) ────────────────────────────
// Serves public/admin/index.html at /admin/
// __dirname in compiled JS = dist/ → join with '..' to reach project root
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Write-Operation Protection ────────────────────────────
/**
 * All mutating HTTP methods (POST/PUT/DELETE/PATCH) on the /api/* routes
 * require a valid admin session token — EXCEPT the login endpoint itself.
 *
 * GET requests are always open (read-only, safe).
 * The CLI tool is unaffected (it uses Mongoose directly, not this API).
 */
app.use('/api', (req: Request, res: Response, next: NextFunction): void => {
  // Pass through all reads and the login endpoint
  if (
    req.method === 'GET' ||
    req.method === 'OPTIONS' ||
    req.path === '/admin/login'
  ) {
    return next();
  }
  // All other writes require a valid admin token
  adminAuth(req, res, next);
});

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
app.use('/api/admin', adminRoutes);
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
