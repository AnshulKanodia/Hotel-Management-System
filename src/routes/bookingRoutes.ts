import { Router } from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  checkIn,
  checkOut,
} from '../controllers/BookingController';

/**
 * bookingRoutes
 * ──────────────
 * All routes for the Booking resource.
 * Mounted in app.ts at: /api/bookings
 *
 * ⚠️  Route ordering matters:
 *   /  :id/checkin   and  /:id/checkout  must come BEFORE  /:id
 *   Otherwise Express would match them as an ObjectId param.
 *
 * File location: src/routes/bookingRoutes.ts
 */
const router = Router();

// POST   /api/bookings            → Create a booking
// GET    /api/bookings            → Get all bookings
router.route('/').post(createBooking).get(getAllBookings);

// PATCH  /api/bookings/:id/checkin   → Booked → CheckedIn
// ⚠️  Must come BEFORE /:id
router.route('/:id/checkin').patch(checkIn);

// PATCH  /api/bookings/:id/checkout  → CheckedIn → CheckedOut
// ⚠️  Must come BEFORE /:id
router.route('/:id/checkout').patch(checkOut);

// GET    /api/bookings/:id        → Get one booking
// PUT    /api/bookings/:id        → Update dates
// DELETE /api/bookings/:id        → Cancel booking (soft delete)
router
  .route('/:id')
  .get(getBookingById)
  .put(updateBooking)
  .delete(cancelBooking);

export default router;
