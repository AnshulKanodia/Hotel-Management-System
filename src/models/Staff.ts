import { Schema, model, Document, Types } from 'mongoose';

// ─── TypeScript Interface ──────────────────────────────────
/**
 * IStaff represents the shape of a Staff document in MongoDB.
 */
export interface IStaff extends Document {
  name: string;
  email: string;
  phone: string;
  role: string;
  salary: number;
  department: Types.ObjectId;   // Reference to Department._id
  createdAt: Date;
  updatedAt: Date;
}

// ─── Mongoose Schema ───────────────────────────────────────
/**
 * StaffSchema defines the structure for the Staff collection.
 *
 * Relationship: Many Staff → One Department (Many-to-One)
 * The department field stores the ObjectId of the Department this staff belongs to.
 * This is the "many" side of the One-to-Many relationship.
 */
const StaffSchema = new Schema<IStaff>(
  {
    name: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,                            // Each staff member has a unique email
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
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      maxlength: [50, 'Role cannot exceed 50 characters'],
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary cannot be negative'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',                       // References the Department model
      required: [true, 'Department is required'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Staff = model<IStaff>('Staff', StaffSchema);

export default Staff;
