import { Schema, model, Document } from 'mongoose';

// ─── Room Status Enum ──────────────────────────────────────
/**
 * RoomStatus defines the valid states a hotel room can be in.
 * Used both as a TypeScript type and as a Mongoose enum validator.
 */
export enum RoomStatus {
  Available = 'Available',
  Occupied = 'Occupied',
  Maintenance = 'Maintenance',
}

// ─── TypeScript Interface ──────────────────────────────────
/**
 * IRoom represents the shape of a Room document in MongoDB.
 */
export interface IRoom extends Document {
  roomNumber: string;
  roomType: string;
  pricePerNight: number;
  capacity: number;
  status: RoomStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Mongoose Schema ───────────────────────────────────────
/**
 * RoomSchema defines the structure for the Room collection.
 *
 * Relationship: One Room → Many Bookings (One-to-Many)
 * The Booking model holds the reference back to Room via room: ObjectId.
 */
const RoomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,                               // Each room has a unique number e.g. "101", "202A"
      trim: true,
    },
    roomType: {
      type: String,
      required: [true, 'Room type is required'],
      trim: true,
      // e.g. "Single", "Double", "Suite", "Deluxe"
      maxlength: [50, 'Room type cannot exceed 50 characters'],
    },
    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [0, 'Price cannot be negative'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(RoomStatus),
        message: `Status must be one of: ${Object.values(RoomStatus).join(', ')}`,
      },
      default: RoomStatus.Available,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Room = model<IRoom>('Room', RoomSchema);

export default Room;
