import { Router } from 'express';
import { adminLogin, adminLogout } from '../controllers/AdminController';
import { adminAuth } from '../middlewares/adminAuth';

/**
 * adminRoutes
 * ────────────
 * Authentication routes for the web admin panel.
 * Mounted in app.ts at: /api/admin
 *
 * POST /api/admin/login   → verify password → return session token
 * POST /api/admin/logout  → revoke session token (requires valid token)
 *
 * File location: src/routes/adminRoutes.ts
 */
const router = Router();

router.post('/login', adminLogin);
router.post('/logout', adminAuth, adminLogout);

export default router;
