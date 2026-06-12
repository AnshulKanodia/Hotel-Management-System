import { Router } from 'express';
import {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} from '../controllers/DepartmentController';

/**
 * departmentRoutes
 * ─────────────────
 * Defines all routes for the Department resource.
 * Mounted in app.ts at: /api/departments
 *
 * File location: src/routes/departmentRoutes.ts
 */
const router = Router();

// POST   /api/departments       → Create a department
// GET    /api/departments       → Get all departments
router.route('/').post(createDepartment).get(getAllDepartments);

// GET    /api/departments/:id   → Get one department
// PUT    /api/departments/:id   → Update a department
// DELETE /api/departments/:id   → Delete a department
router
  .route('/:id')
  .get(getDepartmentById)
  .put(updateDepartment)
  .delete(deleteDepartment);

export default router;
