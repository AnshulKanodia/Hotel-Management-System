import { Schema, model, Document } from 'mongoose';

// ─── TypeScript Interface ──────────────────────────────────
/**
 * ICustomer represents the shape of a Customer document in MongoDB.
 */
export interface ICustomer extends Document {
  name: string;
  email: string;
  phone: string;
  address: string;
  idProof: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Mongoose Schema ───────────────────────────────────────
/**
 * CustomerSchema defines the structure for the Customer collection.
 *
 * Relationship: One Customer → Many Bookings (One-to-Many)
 * The Booking model holds the reference back to Customer via customer: ObjectId.
 */
const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10,15}$/, 'Please enter a valid phone number'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    idProof: {
      type: String,
      required: [true, 'ID Proof is required'],
      trim: true,
      maxlength: [100, 'ID Proof cannot exceed 100 characters'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Customer = model<ICustomer>('Customer', CustomerSchema);

export default Customer;
