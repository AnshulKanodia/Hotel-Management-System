import { Router } from 'express';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../controllers/CustomerController';

/**
 * customerRoutes
 * ───────────────
 * Defines all routes for the Customer resource.
 * Mounted in app.ts at: /api/customers
 *
 * File location: src/routes/customerRoutes.ts
 */
const router = Router();

// POST   /api/customers         → Create a customer
// GET    /api/customers         → Get all customers
router.route('/').post(createCustomer).get(getAllCustomers);

// GET    /api/customers/:id     → Get one customer
// PUT    /api/customers/:id     → Update a customer
// DELETE /api/customers/:id     → Delete a customer
router
  .route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

export default router;
