import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandler';
import { AppError } from '../middlewares/errorHandler';
import { generateAdminToken, revokeAdminToken } from '../middlewares/adminAuth';

/**
 * AdminController
 * ────────────────
 * Handles admin authentication for the web panel.
 * Password is read from process.env.ADMIN_PASSWORD.
 *
 * File location: src/controllers/AdminController.ts
 */

// ─── POST /api/admin/login ─────────────────────────────────
/**
 * adminLogin
 * Verifies the submitted password against ADMIN_PASSWORD env var.
 * Returns a 64-char session token valid for 8 hours.
 */
export const adminLogin = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new AppError(
        'ADMIN_PASSWORD is not set in environment variables. ' +
          'Add ADMIN_PASSWORD=your_password to your .env file.',
        500
      );
    }

    if (!password || typeof password !== 'string') {
      throw new AppError('Password is required.', 400);
    }

    if (password !== adminPassword) {
      throw new AppError('Invalid password.', 401);
    }

    const token = generateAdminToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      expiresIn: '8h',
    });
  }
);

// ─── POST /api/admin/logout ────────────────────────────────
/**
 * adminLogout
 * Revokes the current session token immediately.
 */
export const adminLogout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      revokeAdminToken(header.slice(7));
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
);
