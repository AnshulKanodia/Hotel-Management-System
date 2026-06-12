import { Router } from 'express';
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} from '../controllers/StaffController';

/**
 * staffRoutes
 * ────────────
 * All routes for the Staff resource.
 * Mounted in app.ts at: /api/staff
 *
 * File location: src/routes/staffRoutes.ts
 */
const router = Router();

// POST   /api/staff       → Create a staff member
// GET    /api/staff       → Get all staff (with department populated)
router.route('/').post(createStaff).get(getAllStaff);

// GET    /api/staff/:id   → Get one staff member
// PUT    /api/staff/:id   → Update a staff member
// DELETE /api/staff/:id   → Delete a staff member
router.route('/:id').get(getStaffById).put(updateStaff).delete(deleteStaff);

export default router;
