import { Request, Response } from 'express';

/**
 * notFound
 * ─────────
 * Middleware mounted AFTER all valid routes in app.ts.
 * If a request reaches this point, no route matched — return a clean 404.
 *
 * Placement in app.ts:  app.use(notFound)  ← before errorHandler
 */
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
