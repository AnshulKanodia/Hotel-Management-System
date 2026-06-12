import { Request, Response } from 'express';
import Customer from '../models/Customer';
import asyncHandler from '../middlewares/asyncHandler';
import { AppError } from '../middlewares/errorHandler';

/**
 * CustomerController
 * ───────────────────
 * Contains all CRUD handlers for the Customer resource.
 * Each method is wrapped with asyncHandler — no try-catch needed here.
 *
 * File location: src/controllers/CustomerController.ts
 */

// ─── POST /api/customers ───────────────────────────────────
/**
 * createCustomer
 * Creates a new customer.
 * Returns 409 if the email is already registered.
 */
export const createCustomer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, phone, address, idProof } = req.body;

    // Check for duplicate email before attempting insert
    const existing = await Customer.findOne({ email: email.toLowerCase() });

    if (existing) {
      throw new AppError(`Customer with email "${email}" already exists`, 409);
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      address,
      idProof,
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  }
);

// ─── GET /api/customers ────────────────────────────────────
/**
 * getAllCustomers
 * Returns all customers sorted by name ascending.
 */
export const getAllCustomers = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const customers = await Customer.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      count: customers.length,
      data: customers,
    });
  }
);

// ─── GET /api/customers/:id ────────────────────────────────
/**
 * getCustomerById
 * Returns a single customer by MongoDB ObjectId.
 */
export const getCustomerById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Customer retrieved successfully',
      data: customer,
    });
  }
);

// ─── PUT /api/customers/:id ────────────────────────────────
/**
 * updateCustomer
 * Updates one or more fields of an existing customer.
 * If email is being changed, checks it isn't already taken by another customer.
 */
export const updateCustomer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, phone, address, idProof } = req.body;

    // If email is being updated, check for conflicts
    if (email) {
      const duplicate = await Customer.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }, // exclude current document
      });

      if (duplicate) {
        throw new AppError(`Email "${email}" is already in use`, 409);
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, address, idProof },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  }
);

// ─── DELETE /api/customers/:id ─────────────────────────────
/**
 * deleteCustomer
 * Permanently deletes a customer by ID.
 *
 * Note: In Phase 3+, we will add a guard to prevent deletion
 * if the customer has active bookings.
 */
export const deleteCustomer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
      data: null,
    });
  }
);
