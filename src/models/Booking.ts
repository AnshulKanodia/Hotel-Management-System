import { Schema, model, Document, Types } from 'mongoose';

// ─── Booking Status Enum ───────────────────────────────────
/**
 * BookingStatus defines the valid lifecycle states of a booking.
 */
export enum BookingStatus {
  Booked = 'Booked',
  CheckedIn = 'CheckedIn',
  CheckedOut = 'CheckedOut',
  Cancelled = 'Cancelled',
}

// ─── TypeScript Interface ──────────────────────────────────
/**
 * IBooking represents the shape of a Booking document in MongoDB.
 *
 * Relationships this model participates in:
 *   - Many-to-One with Customer: many bookings can belong to one customer
 *   - Many-to-One with Room: many bookings can reference one room (across time)
 */
export interface IBooking extends Document {
  customer: Types.ObjectId;       // Reference → Customer._id
  room: Types.ObjectId;           // Reference → Room._id
  checkInDate: Date;
  checkOutDate: Date;
  totalAmount: number;
  bookingStatus: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Mongoose Schema ───────────────────────────────────────
/**
 * BookingSchema is the central junction of the system.
 * It links a Customer to a Room with a time range and price.
 */
const BookingSchema = new Schema<IBooking>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',                           // References the Customer model
      required: [true, 'Customer reference is required'],
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',                               // References the Room model
      required: [true, 'Room reference is required'],
    },
    checkInDate: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },
    checkOutDate: {
      type: Date,
      required: [true, 'Check-out date is required'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    bookingStatus: {
      type: String,
      enum: {
        values: Object.values(BookingStatus),
        message: `Booking status must be one of: ${Object.values(BookingStatus).join(', ')}`,
      },
      default: BookingStatus.Booked,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Custom Validation ─────────────────────────────────────
// Ensure checkOutDate is always after checkInDate
BookingSchema.pre('validate', function () {
  if (this.checkOutDate <= this.checkInDate) {
    throw new Error('Check-out date must be after check-in date');
  }
});

// ─── Indexes ───────────────────────────────────────────────
/**
 * Compound index for the conflict-detection query in BookingController:
 *   { room, bookingStatus, checkInDate, checkOutDate }
 * Without this, every booking creation does a full collection scan.
 */
BookingSchema.index({ room: 1, bookingStatus: 1, checkInDate: 1, checkOutDate: 1 });

/** For customer booking history and deletion guard */
BookingSchema.index({ customer: 1, bookingStatus: 1 });

/** For filtering/counting by status (reports, dashboard) */
BookingSchema.index({ bookingStatus: 1 });

const Booking = model<IBooking>('Booking', BookingSchema);

export default Booking;
