import { Router } from 'express';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/CustomerController';
import { validate } from '../middlewares/validate';
import { createCustomerSchema, updateCustomerSchema } from '../validators/schemas';

/**
 * customerRoutes
 * ───────────────
 * Defines all routes for the Customer resource.
 * Mounted in app.ts at: /api/customers
 *
 * Zod validation applied to all write operations (POST, PUT).
 *
 * File location: src/routes/customerRoutes.ts
 */
const router = Router();

// POST   /api/customers         → Validate body → Create a customer
// GET    /api/customers         → Get all customers
router.route('/').post(validate(createCustomerSchema), createCustomer).get(getAllCustomers);

// GET    /api/customers/:id     → Get one customer
// PUT    /api/customers/:id     → Validate body → Update a customer
// DELETE /api/customers/:id     → Delete a customer
router
  .route('/:id')
  .get(getCustomerById)
  .put(validate(updateCustomerSchema), updateCustomer)
  .delete(deleteCustomer);

export default router;
