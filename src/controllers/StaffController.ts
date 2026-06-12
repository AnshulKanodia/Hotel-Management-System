import { Request, Response } from 'express';
import Staff from '../models/Staff';
import Department from '../models/Department';
import asyncHandler from '../middlewares/asyncHandler';
import { AppError } from '../middlewares/errorHandler';

/**
 * StaffController
 * ────────────────
 * CRUD handlers for the Staff resource.
 * Key behaviours:
 *   - Validates that the referenced department exists before create/update
 *   - Prevents duplicate emails
 *   - Always populates department details on read operations
 *
 * File location: src/controllers/StaffController.ts
 */

// ─── POST /api/staff ───────────────────────────────────────
/**
 * createStaff
 * Creates a new staff member.
 * Guards: duplicate email, department must exist.
 */
export const createStaff = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, phone, role, salary, department } = req.body;

    // 1. Ensure the department exists
    const dept = await Department.findById(department);
    if (!dept) {
      throw new AppError('Department not found. Please provide a valid department ID.', 404);
    }

    // 2. Check for duplicate email
    const existing = await Staff.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError(`Staff with email "${email}" already exists`, 409);
    }

    const staff = await Staff.create({ name, email, phone, role, salary, department });

    // Populate department before returning so the response is immediately useful
    await staff.populate('department', 'name description');

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: staff,
    });
  }
);

// ─── GET /api/staff ────────────────────────────────────────
/**
 * getAllStaff
 * Returns all staff members with their department details populated.
 * Sorted by name ascending.
 */
export const getAllStaff = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const staff = await Staff.find()
      .populate('department', 'name description')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: 'Staff retrieved successfully',
      count: staff.length,
      data: staff,
    });
  }
);

// ─── GET /api/staff/:id ────────────────────────────────────
/**
 * getStaffById
 * Returns a single staff member with department populated.
 */
export const getStaffById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const staff = await Staff.findById(req.params.id).populate(
      'department',
      'name description'
    );

    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Staff retrieved successfully',
      data: staff,
    });
  }
);

// ─── PUT /api/staff/:id ────────────────────────────────────
/**
 * updateStaff
 * Updates one or more fields of a staff member.
 * If department is changing, validates the new department exists.
 * If email is changing, checks it isn't taken by another staff member.
 */
export const updateStaff = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, phone, role, salary, department } = req.body;

    // Validate new department if provided
    if (department) {
      const dept = await Department.findById(department);
      if (!dept) {
        throw new AppError('Department not found. Please provide a valid department ID.', 404);
      }
    }

    // Check for email conflict (exclude current document)
    if (email) {
      const duplicate = await Staff.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        throw new AppError(`Email "${email}" is already in use`, 409);
      }
    }

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, role, salary, department },
      { new: true, runValidators: true }
    ).populate('department', 'name description');

    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      data: staff,
    });
  }
);

// ─── DELETE /api/staff/:id ─────────────────────────────────
/**
 * deleteStaff
 * Permanently removes a staff member.
 */
export const deleteStaff = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Staff deleted successfully',
      data: null,
    });
  }
);
