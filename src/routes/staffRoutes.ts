import { Router } from 'express';
import {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
} from '../controllers/StaffController';
import { validate } from '../middlewares/validate';
import { createStaffSchema, updateStaffSchema } from '../validators/schemas';

/**
 * staffRoutes
 * ────────────
 * All routes for the Staff resource.
 * Mounted in app.ts at: /api/staff
 *
 * Zod validation applied to all write operations (POST, PUT).
 *
 * File location: src/routes/staffRoutes.ts
 */
const router = Router();

// POST   /api/staff       → Validate body → Create a staff member
// GET    /api/staff       → Get all staff (with department populated)
router.route('/').post(validate(createStaffSchema), createStaff).get(getAllStaff);

// GET    /api/staff/:id   → Get one staff member
// PUT    /api/staff/:id   → Validate body → Update a staff member
// DELETE /api/staff/:id   → Delete a staff member
router.route('/:id').get(getStaffById).put(validate(updateStaffSchema), updateStaff).delete(deleteStaff);

export default router;
