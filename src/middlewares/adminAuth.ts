import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * adminAuth.ts
 * ────────────
 * In-memory session store for the web admin panel.
 * Tokens are 64-char hex random strings with an 8-hour TTL.
 * Expired tokens are cleaned up every hour.
 *
 * This only protects the HTTP API write operations.
 * The CLI (which uses Mongoose directly) is unaffected.
 */

// token → expiry timestamp (ms)
const sessions = new Map<string, number>();

// ─── Cleanup ───────────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of sessions) {
    if (now > expiry) sessions.delete(token);
  }
}, 60 * 60 * 1000); // every hour

// ─── Token Helpers ─────────────────────────────────────────
export const generateAdminToken = (): string => {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + 8 * 60 * 60 * 1000); // 8 hours
  return token;
};

export const revokeAdminToken = (token: string): void => {
  sessions.delete(token);
};

// ─── Middleware ────────────────────────────────────────────
/**
 * adminAuth
 * Reads `Authorization: Bearer <token>` header and validates
 * the token against the in-memory session store.
 * Returns 401 on missing, invalid, or expired token.
 */
export const adminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Admin access required. Please log in at /admin/',
    });
    return;
  }

  const token = header.slice(7);
  const expiry = sessions.get(token);

  if (!expiry || Date.now() > expiry) {
    sessions.delete(token);
    res.status(401).json({
      success: false,
      message: 'Session expired. Please log in again.',
    });
    return;
  }

  next();
};
