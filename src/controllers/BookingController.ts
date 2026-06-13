import { Request, Response } from 'express';
import Booking, { BookingStatus, IBooking } from '../models/Booking';
import Room, { RoomStatus } from '../models/Room';
import Customer from '../models/Customer';
import asyncHandler from '../middlewares/asyncHandler';
import { AppError } from '../middlewares/errorHandler';

/**
 * BookingController
 * ──────────────────
 * Core hotel booking logic. Handles the full lifecycle of a booking:
 *   Create → CheckedIn → CheckedOut  (or Cancelled at any stage)
 *
 * Business rules enforced here:
 *   1. Customer and Room must exist
 *   2. Room must be Available at time of booking
 *   3. Booking conflict detection (date overlap against existing active bookings)
 *   4. checkOutDate must be strictly after checkInDate
 *   5. totalAmount auto-calculated (nights × pricePerNight)
 *   6. Room status transitions: Available ↔ Occupied
 *   7. Soft-delete for cancellations (bookingStatus = Cancelled, no DB row removed)
 *   8. Strict status-flow guards for check-in and check-out
 *
 * File location: src/controllers/BookingController.ts
 */

// ─── Helper: Populate Query ────────────────────────────────
/**
 * Returns a Mongoose query with standard customer + room population applied.
 * Keeps every read handler DRY — one definition, used everywhere.
 */
const populateBooking = (query: ReturnType<typeof Booking.findById | typeof Booking.findOne>) =>
  query
    .populate('customer', 'name email phone')
    .populate('room', 'roomNumber roomType pricePerNight status') as Promise<IBooking | null>;

// ─── Helper: Date Diff in Nights ──────────────────────────
/**
 * Returns the number of whole nights between two dates.
 * Both inputs are Date objects; result is always a positive integer.
 */
const calculateNights = (checkIn: Date, checkOut: Date): number => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / msPerDay);
};

// ─── Helper: Conflict Detection ───────────────────────────
/**
 * checkRoomAvailability
 * Queries active bookings (Booked | CheckedIn) for the given room that
 * overlap with the requested date range.
 *
 * Overlap condition (Allen's interval algebra):
 *   existing.checkIn  < newCheckOut  AND
 *   existing.checkOut > newCheckIn
 *
 * An optional excludeBookingId is used during updates so the booking
 * being edited doesn't conflict with itself.
 */
const checkRoomAvailability = async (
  roomId: string,
  checkInDate: Date,
  checkOutDate: Date,
  excludeBookingId?: string
): Promise<void> => {
  const conflictQuery: Record<string, unknown> = {
    room: roomId,
    bookingStatus: { $in: [BookingStatus.Booked, BookingStatus.CheckedIn] },
    checkInDate: { $lt: checkOutDate },
    checkOutDate: { $gt: checkInDate },
  };

  if (excludeBookingId) {
    conflictQuery._id = { $ne: excludeBookingId };
  }

  const conflict = await Booking.findOne(conflictQuery);

  if (conflict) {
    throw new AppError(
      `Room is already booked for the selected dates ` +
        `(${conflict.checkInDate.toISOString().split('T')[0]} → ` +
        `${conflict.checkOutDate.toISOString().split('T')[0]})`,
      409
    );
  }
};

// ══════════════════════════════════════════════════════════
//  POST /api/bookings
// ══════════════════════════════════════════════════════════
/**
 * createBooking
 * Steps:
 *   1. Validate customer exists
 *   2. Validate room exists and is Available
 *   3. Validate dates
 *   4. Check for date conflicts with existing bookings
 *   5. Calculate totalAmount
 *   6. Create booking (status = Booked)
 *   7. Set room status → Occupied
 *   8. Return populated booking
 */
export const createBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { customer, room, checkInDate, checkOutDate } = req.body;

    // ── 1. Customer must exist ─────────────────────────────
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      throw new AppError('Customer not found. Please provide a valid customer ID.', 404);
    }

    // ── 2. Room must exist and be Available ────────────────
    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      throw new AppError('Room not found. Please provide a valid room ID.', 404);
    }
    if (roomDoc.status !== RoomStatus.Available) {
      throw new AppError(
        `Room "${roomDoc.roomNumber}" is currently ${roomDoc.status} and cannot be booked.`,
        400
      );
    }

    // ── 3. Validate dates ──────────────────────────────────
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new AppError('Invalid date format. Use YYYY-MM-DD.', 400);
    }
    if (checkOut <= checkIn) {
      throw new AppError('checkOutDate must be after checkInDate.', 400);
    }

    // ── 4. Conflict detection ──────────────────────────────
    await checkRoomAvailability(room, checkIn, checkOut);

    // ── 5. Calculate total ─────────────────────────────────
    const nights = calculateNights(checkIn, checkOut);
    const totalAmount = nights * roomDoc.pricePerNight;

    // ── 6. Create booking ──────────────────────────────────
    const booking = await Booking.create({
      customer,
      room,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalAmount,
      bookingStatus: BookingStatus.Booked,
    });

    // ── 7. Mark room as Occupied ───────────────────────────
    await Room.findByIdAndUpdate(room, { status: RoomStatus.Occupied });

    // ── 8. Return populated document ──────────────────────
    const populated = await populateBooking(Booking.findById(booking._id));

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        ...populated?.toObject(),
        nights,
      },
    });
  }
);

// ══════════════════════════════════════════════════════════
//  GET /api/bookings
// ══════════════════════════════════════════════════════════
/**
 * getAllBookings
 * Returns all bookings (all statuses) sorted by checkInDate descending.
 */
export const getAllBookings = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const bookings = await Booking.find()
      .populate('customer', 'name email phone')
      .populate('room', 'roomNumber roomType pricePerNight status')
      .sort({ checkInDate: -1 });

    res.status(200).json({
      success: true,
      message: 'Bookings retrieved successfully',
      count: bookings.length,
      data: bookings,
    });
  }
);

// ══════════════════════════════════════════════════════════
//  GET /api/bookings/:id
// ══════════════════════════════════════════════════════════
/**
 * getBookingById
 * Returns a single booking with customer and room fully populated.
 */
export const getBookingById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const booking = await populateBooking(Booking.findById(req.params.id));

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Booking retrieved successfully',
      data: booking,
    });
  }
);

// ══════════════════════════════════════════════════════════
//  PUT /api/bookings/:id
// ══════════════════════════════════════════════════════════
/**
 * updateBooking
 * Allows updating checkInDate and/or checkOutDate only.
 * customer and room are intentionally immutable after creation.
 *
 * Steps:
 *   1. Booking must exist and be in Booked status (not yet checked in)
 *   2. Validate new dates
 *   3. Re-run conflict detection (excluding this booking)
 *   4. Recalculate totalAmount
 *   5. Persist and return populated result
 */
export const updateBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { checkInDate, checkOutDate } = req.body;

    // ── 1. Booking must exist ──────────────────────────────
    const existing = await Booking.findById(req.params.id).populate<{
      room: { _id: string; pricePerNight: number; roomNumber: string };
    }>('room', 'pricePerNight roomNumber');

    if (!existing) {
      throw new AppError('Booking not found', 404);
    }

    // Only allow updates while booking is in Booked state
    if (existing.bookingStatus !== BookingStatus.Booked) {
      throw new AppError(
        `Cannot update a booking with status "${existing.bookingStatus}". Only "Booked" bookings can be updated.`,
        400
      );
    }

    // ── 2. Validate dates ──────────────────────────────────
    const checkIn = checkInDate ? new Date(checkInDate) : existing.checkInDate;
    const checkOut = checkOutDate ? new Date(checkOutDate) : existing.checkOutDate;

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new AppError('Invalid date format. Use YYYY-MM-DD.', 400);
    }
    if (checkOut <= checkIn) {
      throw new AppError('checkOutDate must be after checkInDate.', 400);
    }

    // ── 3. Conflict detection (exclude self) ───────────────
    await checkRoomAvailability(
      String(existing.room),
      checkIn,
      checkOut,
      String(req.params.id)
    );

    // ── 4. Recalculate total ───────────────────────────────
    const nights = calculateNights(checkIn, checkOut);
    const roomData = existing.room as unknown as { pricePerNight: number };
    const totalAmount = nights * roomData.pricePerNight;

    // ── 5. Update and return ───────────────────────────────
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { checkInDate: checkIn, checkOutDate: checkOut, totalAmount },
      { new: true, runValidators: true }
    )
      .populate('customer', 'name email phone')
      .populate('room', 'roomNumber roomType pricePerNight status');

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: {
        ...booking?.toObject(),
        nights,
      },
    });
  }
);

// ══════════════════════════════════════════════════════════
//  DELETE /api/bookings/:id  (Soft Cancel)
// ══════════════════════════════════════════════════════════
/**
 * cancelBooking
 * Soft-delete: does NOT remove the DB document.
 * Sets bookingStatus → Cancelled and room status → Available.
 *
 * Guard: cannot cancel a booking that is already CheckedOut or Cancelled.
 */
export const cancelBooking = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (
      booking.bookingStatus === BookingStatus.Cancelled
    ) {
      throw new AppError('Booking is already cancelled.', 400);
    }

    if (booking.bookingStatus === BookingStatus.CheckedOut) {
      throw new AppError('Cannot cancel a booking that has already been checked out.', 400);
    }

    // Set booking status to Cancelled
    booking.bookingStatus = BookingStatus.Cancelled;
    await booking.save();

    // Free up the room
    await Room.findByIdAndUpdate(booking.room, { status: RoomStatus.Available });

    const populated = await populateBooking(Booking.findById(booking._id));

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: populated,
    });
  }
);

// ══════════════════════════════════════════════════════════
//  PATCH /api/bookings/:id/checkin
// ══════════════════════════════════════════════════════════
/**
 * checkIn
 * Status transition: Booked → CheckedIn
 * Guard: booking must currently be in Booked status.
 * Room is already Occupied from the create step — no room update needed.
 */
export const checkIn = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.bookingStatus !== BookingStatus.Booked) {
      throw new AppError(
        `Check-in is only allowed for bookings with status "Booked". Current status: "${booking.bookingStatus}".`,
        400
      );
    }

    booking.bookingStatus = BookingStatus.CheckedIn;
    await booking.save();

    const populated = await populateBooking(Booking.findById(booking._id));

    res.status(200).json({
      success: true,
      message: 'Guest checked in successfully',
      data: populated,
    });
  }
);

// ══════════════════════════════════════════════════════════
//  PATCH /api/bookings/:id/checkout
// ══════════════════════════════════════════════════════════
/**
 * checkOut
 * Status transition: CheckedIn → CheckedOut
 * Room transition:   Occupied  → Available
 * Guard: booking must currently be in CheckedIn status.
 */
export const checkOut = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.bookingStatus !== BookingStatus.CheckedIn) {
      throw new AppError(
        `Check-out is only allowed for bookings with status "CheckedIn". Current status: "${booking.bookingStatus}".`,
        400
      );
    }

    // Update booking status
    booking.bookingStatus = BookingStatus.CheckedOut;
    await booking.save();

    // Free up the room for new bookings
    await Room.findByIdAndUpdate(booking.room, { status: RoomStatus.Available });

    const populated = await populateBooking(Booking.findById(booking._id));

    res.status(200).json({
      success: true,
      message: 'Guest checked out successfully. Room is now available.',
      data: populated,
    });
  }
);
