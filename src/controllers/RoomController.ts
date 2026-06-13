import { Request, Response } from 'express';
import Room from '../models/Room';
import { RoomStatus } from '../models/Room';
import asyncHandler from '../middlewares/asyncHandler';
import { AppError } from '../middlewares/errorHandler';

/**
 * RoomController
 * ───────────────
 * CRUD handlers for the Room resource plus a filter-by-status endpoint.
 * Key behaviours:
 *   - Unique room number enforced at both app and DB level
 *   - Status validated against the RoomStatus enum
 *   - GET /api/rooms/status/:status filters by Available | Occupied | Maintenance
 *
 * File location: src/controllers/RoomController.ts
 */

// ─── POST /api/rooms ───────────────────────────────────────
/**
 * createRoom
 * Creates a new hotel room.
 * Guard: duplicate room number.
 */
export const createRoom = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { roomNumber, roomType, pricePerNight, capacity, status } = req.body;

    // Check for duplicate room number
    const existing = await Room.findOne({ roomNumber: String(roomNumber) });
    if (existing) {
      throw new AppError(`Room number "${roomNumber}" already exists`, 409);
    }

    const room = await Room.create({
      roomNumber: String(roomNumber),
      roomType,
      pricePerNight,
      capacity,
      status,
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room,
    });
  }
);

// ─── GET /api/rooms ────────────────────────────────────────
/**
 * getAllRooms
 * Returns all rooms sorted by roomNumber ascending.
 */
export const getAllRooms = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const rooms = await Room.find().sort({ roomNumber: 1 });

    res.status(200).json({
      success: true,
      message: 'Rooms retrieved successfully',
      count: rooms.length,
      data: rooms,
    });
  }
);

// ─── GET /api/rooms/status/:status ────────────────────────
/**
 * getRoomsByStatus
 * Filters rooms by their current status: Available | Occupied | Maintenance
 * IMPORTANT: This route must be registered BEFORE /:id in the router
 * to prevent Express matching "status" as an ObjectId.
 */
export const getRoomsByStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const status = String(req.params.status);

    // Validate the status value against the enum
    const validStatuses = Object.values(RoomStatus);
    if (!validStatuses.includes(status as RoomStatus)) {
      throw new AppError(
        `Invalid status "${status}". Valid values are: ${validStatuses.join(', ')}`,
        400
      );
    }

    const rooms = await Room.find({ status: status as RoomStatus }).sort({ roomNumber: 1 });

    res.status(200).json({
      success: true,
      message: `Rooms with status "${status}" retrieved successfully`,
      count: rooms.length,
      data: rooms,
    });
  }
);

// ─── GET /api/rooms/:id ────────────────────────────────────
/**
 * getRoomById
 * Returns a single room by MongoDB ObjectId.
 */
export const getRoomById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const room = await Room.findById(req.params.id);

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Room retrieved successfully',
      data: room,
    });
  }
);

// ─── PUT /api/rooms/:id ────────────────────────────────────
/**
 * updateRoom
 * Updates one or more fields of a room.
 * If roomNumber is changing, checks it isn't already taken.
 */
export const updateRoom = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { roomNumber, roomType, pricePerNight, capacity, status } = req.body;

    // Check for duplicate room number (exclude current document)
    if (roomNumber !== undefined) {
      const duplicate = await Room.findOne({
        roomNumber: String(roomNumber),
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        throw new AppError(`Room number "${roomNumber}" already exists`, 409);
      }
    }

    // Validate status value if provided
    if (status) {
      const validStatuses = Object.values(RoomStatus);
      if (!validStatuses.includes(status as RoomStatus)) {
        throw new AppError(
          `Invalid status "${status}". Valid values are: ${validStatuses.join(', ')}`,
          400
        );
      }
    }

    const updatePayload: Record<string, unknown> = {};
    if (roomNumber !== undefined) updatePayload.roomNumber = String(roomNumber);
    if (roomType !== undefined) updatePayload.roomType = roomType;
    if (pricePerNight !== undefined) updatePayload.pricePerNight = pricePerNight;
    if (capacity !== undefined) updatePayload.capacity = capacity;
    if (status !== undefined) updatePayload.status = status;

    const room = await Room.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room,
    });
  }
);

// ─── DELETE /api/rooms/:id ─────────────────────────────────
/**
 * deleteRoom
 * Permanently removes a room.
 * Note: Phase 4 will add a guard to block deletion if active bookings exist.
 */
export const deleteRoom = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      data: null,
    });
  }
);
