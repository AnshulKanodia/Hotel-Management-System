import { Schema, model, Document } from 'mongoose';

// ─── TypeScript Interface ──────────────────────────────────
/**
 * IDepartment represents the shape of a Department document in MongoDB.
 * Extends Mongoose's Document to include _id, save(), etc.
 */
export interface IDepartment extends Document {
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Mongoose Schema ───────────────────────────────────────
/**
 * DepartmentSchema defines the structure, validation rules, and constraints
 * for the Department collection.
 *
 * Relationship: One Department → Many Staff members (One-to-Many)
 * The "many" side (Staff) holds the reference via department: ObjectId
 */
const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,                        // No two departments with the same name
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Department description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,   // Automatically adds createdAt & updatedAt
    versionKey: false,  // Removes the __v field from documents
  }
);

const Department = model<IDepartment>('Department', DepartmentSchema);

export default Department;
