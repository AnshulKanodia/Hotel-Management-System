import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer';
import Staff from '../models/Staff';
import Room from '../models/Room';
import Booking from '../models/Booking';
import { RoomStatus } from '../models/Room';
import { BookingStatus } from '../models/Booking';
import asyncHandler from '../middlewares/asyncHandler';
import { AppError } from '../middlewares/errorHandler';

/**
 * ReportController
 * ─────────────────
 * All reporting and analytics endpoints using MongoDB Aggregation Pipelines.
 *
 * Aggregation operators demonstrated across all pipelines:
 *   $match   – filter documents before grouping
 *   $group   – aggregate documents into summary buckets
 *   $lookup  – left-join a foreign collection (like SQL JOIN)
 *   $project – shape the output fields
 *   $sort    – order results
 *   $limit   – cap result count
 *   $count   – count matched documents
 *   $sum     – accumulator: add up numeric values
 *   $first   – accumulator: take first value in a group
 *
 * File location: src/controllers/ReportController.ts
 */

// ══════════════════════════════════════════════════════════
//  GET /api/reports/dashboard
// ══════════════════════════════════════════════════════════
/**
 * getDashboardSummary
 * ────────────────────
 * Returns a high-level snapshot of the entire hotel operation.
 * Runs 5 parallel queries using Promise.all for performance —
 * no sequential blocking.
 *
 * Room counts use an aggregation $group on the status field so a single
 * DB round-trip returns Available / Occupied / Maintenance simultaneously.
 */
export const getDashboardSummary = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    // Run all counts in parallel — fastest possible approach
    const [
      totalCustomers,
      totalStaff,
      totalBookings,
      roomStatusCounts,
    ] = await Promise.all([
      Customer.countDocuments(),
      Staff.countDocuments(),
      Booking.countDocuments(),

      /**
       * Room Status Aggregation Pipeline:
       * Stage 1 – $group: group all room documents by their `status` field.
       *           _id becomes the status value, count accumulates with $sum: 1.
       *
       * Result shape: [{ _id: "Available", count: 10 }, { _id: "Occupied", count: 5 }, ...]
       */
      Room.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Flatten the room aggregation array into named keys
    const roomSummary = {
      totalRooms: 0,
      availableRooms: 0,
      occupiedRooms: 0,
      maintenanceRooms: 0,
    };

    for (const entry of roomStatusCounts as { _id: string; count: number }[]) {
      roomSummary.totalRooms += entry.count;
      if (entry._id === RoomStatus.Available) roomSummary.availableRooms = entry.count;
      if (entry._id === RoomStatus.Occupied) roomSummary.occupiedRooms = entry.count;
      if (entry._id === RoomStatus.Maintenance) roomSummary.maintenanceRooms = entry.count;
    }

    res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: {
        totalCustomers,
        totalStaff,
        totalBookings,
        ...roomSummary,
      },
    });
  }
);

// ══════════════════════════════════════════════════════════
//  GET /api/reports/staff-by-department
// ══════════════════════════════════════════════════════════
/**
 * getStaffByDepartment
 * ─────────────────────
 * Returns each department with a count of staff members assigned to it.
 *
 * Aggregation Pipeline (runs on the Staff collection):
 *
 * Stage 1 – $group:
 *   Groups all staff documents by their `department` ObjectId.
 *   Counts the staff in each group with $sum: 1.
 *
 * Stage 2 – $lookup  (LEFT JOIN with departments collection):
 *   For each group, fetches the matching Department document.
 *   localField:   _id      (the grouped department ObjectId)
 *   foreignField: _id      (Department._id)
 *   as:           departmentInfo  (array of matched documents)
 *
 * Stage 3 – $project:
 *   Reshapes output. $arrayElemAt picks the first (only) element from
 *   the departmentInfo array so we get an object instead of an array.
 *
 * Stage 4 – $sort:
 *   Orders result by totalStaff descending (busiest departments first).
 */
export const getStaffByDepartment = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const result = await Staff.aggregate([
      // Stage 1: Group staff by department ObjectId
      {
        $group: {
          _id: '$department',
          totalStaff: { $sum: 1 },
        },
      },

      // Stage 2: Join with the departments collection
      {
        $lookup: {
          from: 'departments',          // MongoDB collection name (lowercase + plural)
          localField: '_id',            // grouped department ObjectId
          foreignField: '_id',          // Department._id
          as: 'departmentInfo',         // output array field
        },
      },

      // Stage 3: Shape the output
      {
        $project: {
          _id: 0,
          department: { $arrayElemAt: ['$departmentInfo.name', 0] },
          description: { $arrayElemAt: ['$departmentInfo.description', 0] },
          totalStaff: 1,
        },
      },

      // Stage 4: Sort by most staff first
      {
        $sort: { totalStaff: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Staff by department retrieved successfully',
      count: result.length,
      data: result,
    });
  }
);

// ══════════════════════════════════════════════════════════
//  GET /api/reports/room-status
// ══════════════════════════════════════════════════════════
/**
 * getRoomStatusReport
 * ────────────────────
 * Returns a breakdown of room counts by status.
 *
 * Aggregation Pipeline (runs on the Room collection):
 *
 * Stage 1 – $group:
 *   Groups all rooms by `status` field.
 *   Counts rooms per group with $sum: 1.
 *
 * Stage 2 – $project:
 *   Renames _id → status for a cleaner response shape.
 *
 * Stage 3 – $sort:
 *   Alphabetical order by status name.
 */
export const getRoomStatusReport = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const result = await Room.aggregate([
      // Stage 1: Count rooms per status
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },

      // Stage 2: Rename _id to status
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },

      // Stage 3: Alphabetical sort
      {
        $sort: { status: 1 },
      },
    ]);

    // Build a guaranteed-complete summary even if some statuses have 0 rooms
    const summary: Record<string, number> = {
      Available: 0,
      Occupied: 0,
      Maintenance: 0,
    };

    for (const entry of result as { status: string; count: number }[]) {
      summary[entry.status] = entry.count;
    }

    res.status(200).json({
      success: true,
      message: 'Room status report retrieved successfully',
      data: {
        breakdown: result,
        summary,
      },
    });
  }
);

// ══════════════════════════════════════════════════════════
//  GET /api/reports/booking-status
// ══════════════════════════════════════════════════════════
/**
 * getBookingStatusReport
 * ───────────────────────
 * Returns counts of bookings grouped by their lifecycle status.
 *
 * Aggregation Pipeline (runs on the Booking collection):
 *
 * Stage 1 – $group:
 *   Groups all booking documents by `bookingStatus`.
 *   Counts each group with $sum: 1.
 *
 * Stage 2 – $project:
 *   Renames _id → status.
 *
 * Stage 3 – $sort:
 *   Alphabetical order by status name.
 */
export const getBookingStatusReport = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const result = await Booking.aggregate([
      // Stage 1: Count bookings per status
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 },
        },
      },

      // Stage 2: Clean up field name
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },

      // Stage 3: Alphabetical sort
      {
        $sort: { status: 1 },
      },
    ]);

    // Guaranteed-complete summary
    const summary: Record<string, number> = {
      Booked: 0,
      CheckedIn: 0,
      CheckedOut: 0,
      Cancelled: 0,
    };

    for (const entry of result as { status: string; count: number }[]) {
      summary[entry.status] = entry.count;
    }

    res.status(200).json({
      success: true,
      message: 'Booking status report retrieved successfully',
      data: {
        breakdown: result,
        summary,
      },
    });
  }
);

// ══════════════════════════════════════════════════════════
//  GET /api/reports/revenue
// ══════════════════════════════════════════════════════════
/**
 * getRevenueReport
 * ─────────────────
 * Calculates total revenue from completed (CheckedOut) bookings only.
 * Pending or cancelled bookings are excluded because money was never
 * fully realised.
 *
 * Aggregation Pipeline (runs on the Booking collection):
 *
 * Stage 1 – $match:
 *   Filters to only CheckedOut bookings (revenue is confirmed).
 *
 * Stage 2 – $group:
 *   Uses _id: null to collapse all matched documents into a single group.
 *   $sum: '$totalAmount' accumulates the revenue.
 *   $count (via $sum: 1) counts how many transactions contributed.
 *
 * Stage 3 – $project:
 *   Removes the ugly _id: null from output.
 */
export const getRevenueReport = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const result = await Booking.aggregate([
      // Stage 1: Only count completed (paid) bookings
      {
        $match: {
          bookingStatus: BookingStatus.CheckedOut,
        },
      },

      // Stage 2: Sum all totalAmount values into one figure
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          completedBookings: { $sum: 1 },
          averageBookingValue: { $avg: '$totalAmount' },
        },
      },

      // Stage 3: Clean output — remove _id: null
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
          completedBookings: 1,
          averageBookingValue: { $round: ['$averageBookingValue', 2] },
        },
      },
    ]);

    // If no checked-out bookings exist yet, return zeroed data
    const data = result[0] ?? {
      totalRevenue: 0,
      completedBookings: 0,
      averageBookingValue: 0,
    };

    res.status(200).json({
      success: true,
      message: 'Revenue report retrieved successfully',
      data,
    });
  }
);

// ══════════════════════════════════════════════════════════
//  GET /api/reports/customer-bookings/:customerId
// ══════════════════════════════════════════════════════════
/**
 * getCustomerBookingHistory
 * ──────────────────────────
 * Returns full customer profile along with their complete booking history,
 * each booking enriched with room details.
 *
 * Aggregation Pipeline (runs on the Booking collection):
 *
 * Stage 1 – $match:
 *   Filters bookings belonging to the requested customerId.
 *
 * Stage 2 – $lookup (join rooms):
 *   Enriches each booking with its room document.
 *
 * Stage 3 – $lookup (join customers):
 *   Enriches each booking with the customer document.
 *
 * Stage 4 – $project:
 *   Flattens the single-element lookup arrays into objects.
 *
 * Stage 5 – $sort:
 *   Most recent bookings first.
 */
export const getCustomerBookingHistory = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const customerId = String(req.params.customerId);

    // Validate ObjectId format before running aggregation
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      throw new AppError('Invalid customer ID format', 400);
    }

    // Confirm customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const bookings = await Booking.aggregate([
      // Stage 1: Filter to this customer's bookings only
      {
        $match: {
          customer: new mongoose.Types.ObjectId(customerId),
        },
      },

      // Stage 2: Join with rooms collection
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'roomInfo',
        },
      },

      // Stage 3: Shape each booking document
      {
        $project: {
          _id: 1,
          checkInDate: 1,
          checkOutDate: 1,
          totalAmount: 1,
          bookingStatus: 1,
          createdAt: 1,
          room: { $arrayElemAt: ['$roomInfo', 0] },
        },
      },

      // Stage 4: Further project room to only needed fields
      {
        $project: {
          _id: 1,
          checkInDate: 1,
          checkOutDate: 1,
          totalAmount: 1,
          bookingStatus: 1,
          createdAt: 1,
          'room._id': 1,
          'room.roomNumber': 1,
          'room.roomType': 1,
          'room.pricePerNight': 1,
          'room.status': 1,
        },
      },

      // Stage 5: Most recent bookings first
      {
        $sort: { checkInDate: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Customer booking history retrieved successfully',
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        },
        totalBookings: bookings.length,
        bookings,
      },
    });
  }
);

// ══════════════════════════════════════════════════════════
//  GET /api/reports/top-customers
// ══════════════════════════════════════════════════════════
/**
 * getTopCustomers
 * ────────────────
 * Returns the top 5 customers ranked by total number of bookings.
 *
 * Aggregation Pipeline (runs on the Booking collection):
 *
 * Stage 1 – $group:
 *   Groups bookings by customer ObjectId.
 *   Counts bookings per customer with $sum: 1.
 *   Sums their total spend with $sum: '$totalAmount'.
 *
 * Stage 2 – $sort:
 *   Orders by booking count descending (highest first).
 *
 * Stage 3 – $limit:
 *   Keeps only the top 5 results.
 *
 * Stage 4 – $lookup:
 *   Joins with the customers collection to fetch name, email, phone.
 *
 * Stage 5 – $project:
 *   Flattens the lookup array and shapes the final output.
 */
export const getTopCustomers = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const result = await Booking.aggregate([
      // Stage 1: Count bookings and spend per customer
      {
        $group: {
          _id: '$customer',
          totalBookings: { $sum: 1 },
          totalSpend: { $sum: '$totalAmount' },
        },
      },

      // Stage 2: Highest booking count first
      {
        $sort: { totalBookings: -1 },
      },

      // Stage 3: Top 5 only
      {
        $limit: 5,
      },

      // Stage 4: Enrich with customer profile data
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo',
        },
      },

      // Stage 5: Shape the final output
      {
        $project: {
          _id: 0,
          customer: {
            _id: { $arrayElemAt: ['$customerInfo._id', 0] },
            name: { $arrayElemAt: ['$customerInfo.name', 0] },
            email: { $arrayElemAt: ['$customerInfo.email', 0] },
            phone: { $arrayElemAt: ['$customerInfo.phone', 0] },
          },
          totalBookings: 1,
          totalSpend: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Top customers retrieved successfully',
      count: result.length,
      data: result,
    });
  }
);

// ══════════════════════════════════════════════════════════
//  GET /api/reports/occupancy
// ══════════════════════════════════════════════════════════
/**
 * getOccupancyReport
 * ───────────────────
 * Returns current occupancy statistics and occupancy percentage.
 *
 * Aggregation Pipeline (runs on the Room collection):
 *
 * Stage 1 – $group:
 *   Groups ALL rooms together (_id: null) and counts total rooms.
 *   Simultaneously uses $sum with a conditional ($cond) to count
 *   only the Occupied rooms without a second query.
 *
 *   $cond: { if: { $eq: ['$status', 'Occupied'] }, then: 1, else: 0 }
 *   — adds 1 for each Occupied room, 0 for everything else.
 *
 * Stage 2 – $project:
 *   Calculates occupancyPercentage using $multiply and $divide.
 *   $round trims to 2 decimal places.
 *   Removes the _id: null field.
 */
export const getOccupancyReport = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const result = await Room.aggregate([
      // Stage 1: Count total rooms and occupied rooms in one pass
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          occupiedRooms: {
            $sum: {
              $cond: [{ $eq: ['$status', RoomStatus.Occupied] }, 1, 0],
            },
          },
          availableRooms: {
            $sum: {
              $cond: [{ $eq: ['$status', RoomStatus.Available] }, 1, 0],
            },
          },
          maintenanceRooms: {
            $sum: {
              $cond: [{ $eq: ['$status', RoomStatus.Maintenance] }, 1, 0],
            },
          },
        },
      },

      // Stage 2: Calculate occupancy percentage
      {
        $project: {
          _id: 0,
          totalRooms: 1,
          occupiedRooms: 1,
          availableRooms: 1,
          maintenanceRooms: 1,
          occupancyPercentage: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$occupiedRooms', '$totalRooms'] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
    ]);

    const data = result[0] ?? {
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      maintenanceRooms: 0,
      occupancyPercentage: 0,
    };

    res.status(200).json({
      success: true,
      message: 'Occupancy report retrieved successfully',
      data,
    });
  }
);
