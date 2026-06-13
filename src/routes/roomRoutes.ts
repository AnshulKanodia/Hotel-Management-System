import { Router } from 'express';
import {
  createRoom,
  getAllRooms,
  getRoomsByStatus,
  getRoomById,
  updateRoom,
  deleteRoom,
} from '../controllers/RoomController';
import { validate } from '../middlewares/validate';
import { createRoomSchema, updateRoomSchema } from '../validators/schemas';

/**
 * roomRoutes
 * ───────────
 * All routes for the Room resource.
 * Mounted in app.ts at: /api/rooms
 *
 * ⚠️  Route order matters here:
 *   /status/:status  MUST be registered before /:id
 *   Otherwise Express will treat the literal string "status" as an ObjectId
 *   and the getRoomsByStatus handler will never be reached.
 *
 * Zod validation applied to all write operations (POST, PUT).
 *
 * File location: src/routes/roomRoutes.ts
 */
const router = Router();

// POST   /api/rooms               → Validate body → Create a room
// GET    /api/rooms               → Get all rooms
router.route('/').post(validate(createRoomSchema), createRoom).get(getAllRooms);

// GET    /api/rooms/status/:status → Filter rooms by status
// ⚠️  Must come BEFORE /:id
router.route('/status/:status').get(getRoomsByStatus);

// GET    /api/rooms/:id           → Get one room
// PUT    /api/rooms/:id           → Validate body → Update a room
// DELETE /api/rooms/:id           → Delete a room
router.route('/:id').get(getRoomById).put(validate(updateRoomSchema), updateRoom).delete(deleteRoom);

export default router;
