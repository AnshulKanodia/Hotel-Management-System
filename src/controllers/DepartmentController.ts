import { Request, Response } from 'express';
import Department from '../models/Department';
import asyncHandler from '../middlewares/asyncHandler';
import { AppError } from '../middlewares/errorHandler';

/**
 * DepartmentController
 * ─────────────────────
 * Contains all CRUD handlers for the Department resource.
 * Each method is wrapped with asyncHandler so thrown errors automatically
 * flow into the global errorHandler — no try-catch boilerplate needed.
 *
 * File location: src/controllers/DepartmentController.ts
 */

// ─── POST /api/departments ─────────────────────────────────
/**
 * createDepartment
 * Creates a new department.
 * Returns 409 if a department with the same name already exists.
 */
export const createDepartment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, description } = req.body;

    // Manual duplicate check gives a friendlier message than the Mongo 11000 error
    const existing = await Department.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }, // case-insensitive match
    });

    if (existing) {
      throw new AppError(`Department "${name}" already exists`, 409);
    }

    const department = await Department.create({ name, description });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  }
);

// ─── GET /api/departments ──────────────────────────────────
/**
 * getAllDepartments
 * Returns all departments sorted by name ascending.
 */
export const getAllDepartments = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const departments = await Department.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: 'Departments retrieved successfully',
      count: departments.length,
      data: departments,
    });
  }
);

// ─── GET /api/departments/:id ──────────────────────────────
/**
 * getDepartmentById
 * Returns a single department by its MongoDB ObjectId.
 * Returns 404 if not found; the CastError handler catches invalid ObjectIds.
 */
export const getDepartmentById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const department = await Department.findById(req.params.id);

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Department retrieved successfully',
      data: department,
    });
  }
);

// ─── PUT /api/departments/:id ──────────────────────────────
/**
 * updateDepartment
 * Updates name and/or description of an existing department.
 * Checks for duplicate name conflict before applying the update.
 */
export const updateDepartment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, description } = req.body;

    // If a new name is provided, ensure it doesn't collide with another document
    if (name) {
      const duplicate = await Department.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }, // exclude the current document
      });

      if (duplicate) {
        throw new AppError(`Department "${name}" already exists`, 409);
      }
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description },
      {
        new: true,           // return the updated document
        runValidators: true, // run schema validators on the new values
      }
    );

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  }
);

// ─── DELETE /api/departments/:id ───────────────────────────
/**
 * deleteDepartment
 * Permanently deletes a department by ID.
 * Returns 404 if not found.
 *
 * Note: In Phase 3, we will add a guard here to prevent deletion
 * if staff members are still assigned to this department.
 */
export const deleteDepartment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      throw new AppError('Department not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
      data: null,
    });
  }
);
