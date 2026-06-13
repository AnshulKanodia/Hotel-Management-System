import { Router } from 'express';
import {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  checkIn,
  checkOut,
  getRoomAvailability,
} from '../controllers/BookingController';
import { validate } from '../middlewares/validate';
import { createBookingSchema, updateBookingSchema } from '../validators/schemas';

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
 * Zod validation applied to POST (create) and PUT (update dates).
 *
 * File location: src/routes/bookingRoutes.ts
 */
const router = Router();

// POST   /api/bookings            → Validate body → Create a booking
// GET    /api/bookings            → Get all bookings
router.route('/').post(validate(createBookingSchema), createBooking).get(getAllBookings);

// GET    /api/bookings/room-availability  → All rooms with isAvailable flag for a date range
// ⚠️  Must come BEFORE /:id
router.route('/room-availability').get(getRoomAvailability);

// PATCH  /api/bookings/:id/checkin   → Booked → CheckedIn
// ⚠️  Must come BEFORE /:id
router.route('/:id/checkin').patch(checkIn);

// PATCH  /api/bookings/:id/checkout  → CheckedIn → CheckedOut
// ⚠️  Must come BEFORE /:id
router.route('/:id/checkout').patch(checkOut);

// GET    /api/bookings/:id        → Get one booking
// PUT    /api/bookings/:id        → Validate body → Update dates
// DELETE /api/bookings/:id        → Cancel booking (soft delete)
router
  .route('/:id')
  .get(getBookingById)
  .put(validate(updateBookingSchema), updateBooking)
  .delete(cancelBooking);

export default router;
