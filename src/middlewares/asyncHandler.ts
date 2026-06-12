import { Request, Response, NextFunction } from 'express';

/**
 * asyncHandler
 * ─────────────
 * A higher-order wrapper that eliminates repetitive try-catch blocks in every
 * controller method. It wraps an async route handler and forwards any rejected
 * promise (thrown error) to Express's next() — which routes it to the global
 * error handler in app.ts.
 *
 * Usage in a controller:
 *   export const getAll = asyncHandler(async (req, res, next) => { ... });
 */
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

export default asyncHandler;
