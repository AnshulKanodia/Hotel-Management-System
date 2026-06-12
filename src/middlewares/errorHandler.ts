import { Request, Response, NextFunction } from 'express';

/**
 * AppError
 * ─────────
 * A custom error class that adds an HTTP status code to the standard Error.
 * Throw this anywhere in controllers/services to produce a specific HTTP error:
 *
 *   throw new AppError('Department not found', 404);
 *
 * The global errorHandler below reads .statusCode to set the response status.
 */
export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * errorHandler
 * ─────────────
 * Global Express error-handling middleware (4-argument signature required).
 * Mounted LAST in app.ts after all routes and the notFound middleware.
 *
 * Handles:
 *  - AppError instances (custom, with statusCode)
 *  - Mongoose CastError   → 400 (invalid ObjectId in URL params)
 *  - Mongoose code 11000  → 409 (duplicate key / unique constraint violation)
 *  - Everything else      → 500 Internal Server Error
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default to 500
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Our own thrown errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Mongoose: invalid ObjectId  e.g. /api/departments/not-an-id
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // MongoDB: duplicate key  (unique index violation)
  else if ((err as NodeJS.ErrnoException & { code?: number }).code === 11000) {
    statusCode = 409;
    const field = Object.keys(
      (err as unknown as { keyValue: Record<string, unknown> }).keyValue || {}
    )[0];
    message = `Duplicate value for field: ${field ?? 'unknown'}`;
  }

  // Mongoose validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Log unexpected server errors
  if (statusCode === 500) {
    console.error(`🔴 Unhandled Error: ${err.message}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
