import { Router } from 'express';
import {
  getDashboardSummary,
  getStaffByDepartment,
  getRoomStatusReport,
  getBookingStatusReport,
  getRevenueReport,
  getCustomerBookingHistory,
  getTopCustomers,
  getOccupancyReport,
} from '../controllers/ReportController';

/**
 * reportRoutes
 * ─────────────
 * All read-only reporting endpoints (GET only — no mutations).
 * Mounted in app.ts at: /api/reports
 *
 * ⚠️  Route ordering:
 *   Named routes (/dashboard, /staff-by-department, etc.) are registered
 *   BEFORE the parameterised route (/:customerId variant is embedded inside
 *   /customer-bookings/:customerId) — no ordering conflict here, but kept
 *   explicit for clarity.
 *
 * File location: src/routes/reportRoutes.ts
 */
const router = Router();

// GET /api/reports/dashboard
router.get('/dashboard', getDashboardSummary);

// GET /api/reports/staff-by-department
router.get('/staff-by-department', getStaffByDepartment);

// GET /api/reports/room-status
router.get('/room-status', getRoomStatusReport);

// GET /api/reports/booking-status
router.get('/booking-status', getBookingStatusReport);

// GET /api/reports/revenue
router.get('/revenue', getRevenueReport);

// GET /api/reports/top-customers
router.get('/top-customers', getTopCustomers);

// GET /api/reports/occupancy
router.get('/occupancy', getOccupancyReport);

// GET /api/reports/customer-bookings/:customerId
router.get('/customer-bookings/:customerId', getCustomerBookingHistory);

export default router;
