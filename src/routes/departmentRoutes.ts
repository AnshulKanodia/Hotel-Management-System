import { Router } from 'express';
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from '../controllers/DepartmentController';
import { validate } from '../middlewares/validate';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/schemas';

/**
 * departmentRoutes
 * ─────────────────
 * Defines all routes for the Department resource.
 * Mounted in app.ts at: /api/departments
 *
 * Zod validation applied to all write operations (POST, PUT).
 *
 * File location: src/routes/departmentRoutes.ts
 */
const router = Router();

// POST   /api/departments       → Validate body → Create a department
// GET    /api/departments       → Get all departments
router.route('/').post(validate(createDepartmentSchema), createDepartment).get(getAllDepartments);

// GET    /api/departments/:id   → Get one department
// PUT    /api/departments/:id   → Validate body → Update a department
// DELETE /api/departments/:id   → Delete a department
router
  .route('/:id')
  .get(getDepartmentById)
  .put(validate(updateDepartmentSchema), updateDepartment)
  .delete(deleteDepartment);

export default router;
