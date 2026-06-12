import dotenv from 'dotenv';

// Load .env variables FIRST — before any other imports that may depend on them
dotenv.config();

import app from './app';
import connectDB from './config/db';

// ─── Configuration ─────────────────────────────────────────
const PORT: number = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV: string = process.env.NODE_ENV || 'development';

// ─── Bootstrap Function ────────────────────────────────────
/**
 * startServer connects to the database first, then starts listening.
 * If DB connection fails, connectDB() calls process.exit(1) internally,
 * so the server never starts with a broken DB connection.
 */
const startServer = async (): Promise<void> => {
  try {
    // Step 1: Connect to MongoDB Atlas
    await connectDB();

    // Step 2: Start the HTTP server only after DB is ready
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Server startup failed: ${error.message}`);
    }
    process.exit(1);
  }
};

// ─── Handle Unhandled Promise Rejections ──────────────────
// Safety net for any async errors not caught by try/catch
process.on('unhandledRejection', (reason: unknown) => {
  console.error('⚠️  Unhandled Rejection:', reason);
  process.exit(1);
});

// ─── Handle Uncaught Exceptions ───────────────────────────
process.on('uncaughtException', (error: Error) => {
  console.error('⚠️  Uncaught Exception:', error.message);
  process.exit(1);
});

startServer();
