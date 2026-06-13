  import { z } from 'zod';

/**
 * schemas.ts
 * ───────────
 * Central Zod validation schemas for all API request bodies.
 * Written for Zod v4.x (uses `error:` not `required_error:` / `invalid_type_error:`).
 * Used by the `validate` middleware (src/middlewares/validate.ts).
 *
 * Naming convention:
 *   create<Resource>Schema  → all required fields, strict
 *   update<Resource>Schema  → all optional (partial), same constraints
 *
 * File location: src/validators/schemas.ts
 */

// ─── Reusable field definitions ─────────────────────────────

/** Validates a 10–15 digit phone number (digits only, no spaces/dashes) */
const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9]{10,15}$/,
    'Phone number must be 10–15 digits (numbers only, no spaces or dashes)'
  );

/** Validates a standard email address */
const emailSchema = z.string().trim().toLowerCase().email('Please enter a valid email address');

/** Validates a MongoDB ObjectId (24 hex characters) */
const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-fA-F0-9]{24}$/, 'Must be a valid MongoDB ObjectId (24 hex characters)');

/** Validates a non-negative number */
const nonNegativeNumber = (fieldName: string) =>
  z.number({ error: `${fieldName} must be a number` }).min(0, `${fieldName} cannot be negative`);

// ══════════════════════════════════════════════════════════
//  CUSTOMER
// ══════════════════════════════════════════════════════════

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name cannot exceed 100 characters'),

  email: emailSchema,

  phone: phoneSchema,

  address: z
    .string()
    .trim()
    .min(1, 'Address cannot be empty')
    .max(300, 'Address cannot exceed 300 characters'),

  idProof: z
    .string()
    .trim()
    .min(1, 'ID Proof cannot be empty')
    .max(100, 'ID Proof cannot exceed 100 characters'),
});

/** For PUT /api/customers/:id — all fields optional, same rules */
export const updateCustomerSchema = createCustomerSchema.partial();

// ══════════════════════════════════════════════════════════
//  DEPARTMENT
// ══════════════════════════════════════════════════════════

export const createDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Department name cannot be empty')
    .max(100, 'Department name cannot exceed 100 characters'),

  description: z
    .string()
    .trim()
    .min(1, 'Description cannot be empty')
    .max(500, 'Description cannot exceed 500 characters'),
});

/** For PUT /api/departments/:id */
export const updateDepartmentSchema = createDepartmentSchema.partial();

// ══════════════════════════════════════════════════════════
//  STAFF
// ══════════════════════════════════════════════════════════

export const createStaffSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name cannot exceed 100 characters'),

  email: emailSchema,

  phone: phoneSchema,

  role: z
    .string()
    .trim()
    .min(1, 'Role cannot be empty')
    .max(50, 'Role cannot exceed 50 characters'),

  salary: nonNegativeNumber('Salary'),

  department: objectIdSchema,
});

/** For PUT /api/staff/:id */
export const updateStaffSchema = createStaffSchema.partial();

// ══════════════════════════════════════════════════════════
//  ROOM
// ══════════════════════════════════════════════════════════

const roomStatusValues = ['Available', 'Occupied', 'Maintenance'] as const;

export const createRoomSchema = z.object({
  roomNumber: z.string().trim().min(1, 'Room number cannot be empty'),

  roomType: z
    .string()
    .trim()
    .min(1, 'Room type cannot be empty')
    .max(50, 'Room type cannot exceed 50 characters'),

  pricePerNight: nonNegativeNumber('Price per night'),

  capacity: z
    .number({ error: 'Capacity must be a number' })
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1'),

  status: z
    .enum(roomStatusValues, {
      error: `Status must be one of: ${roomStatusValues.join(', ')}`,
    })
    .optional()
    .default('Available'),
});

/** For PUT /api/rooms/:id — all fields optional */
export const updateRoomSchema = createRoomSchema
  .omit({ status: true })
  .extend({
    status: z
      .enum(roomStatusValues, {
        error: `Status must be one of: ${roomStatusValues.join(', ')}`,
      })
      .optional(),
  })
  .partial();

// ══════════════════════════════════════════════════════════
//  BOOKING
// ══════════════════════════════════════════════════════════

/** Validates a date string (any parseable format) and coerces to a string */
const dateStringSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: `${fieldName} must be a valid date (e.g. 2025-12-31)`,
    });

export const createBookingSchema = z
  .object({
    customer: objectIdSchema,
    room: objectIdSchema,
    checkInDate: dateStringSchema('Check-in date'),
    checkOutDate: dateStringSchema('Check-out date'),
  })
  .refine((data) => new Date(data.checkOutDate) > new Date(data.checkInDate), {
    message: 'Check-out date must be after check-in date',
    path: ['checkOutDate'],
  });

/** For PUT /api/bookings/:id — only dates, both optional */
export const updateBookingSchema = z
  .object({
    checkInDate: dateStringSchema('Check-in date'),
    checkOutDate: dateStringSchema('Check-out date'),
  })
  .partial()
  .refine(
    (data) => {
      if (data.checkInDate && data.checkOutDate) {
        return new Date(data.checkOutDate) > new Date(data.checkInDate);
      }
      return true;
    },
    {
      message: 'Check-out date must be after check-in date',
      path: ['checkOutDate'],
    }
  );
