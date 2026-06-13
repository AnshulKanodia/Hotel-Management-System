import { select, input, confirm, Separator } from '@inquirer/prompts';
import Room, { IRoom, RoomStatus } from '../models/Room';

/**
 * roomMenu
 * ─────────
 * Interactive CLI module for Room Management.
 *
 * Features:
 *   1. View All Rooms        — formatted table with status indicators
 *   2. View Rooms by Status  — filter: Available | Occupied | Maintenance
 *   3. Add Room              — validated form, saved to MongoDB
 *   4. Update Room Status    — pick room, pick new status
 *   5. Delete Room           — guard: block if active bookings exist
 *
 * File location: src/cli/roomMenu.ts
 */

type RoomMenuChoice = 'view' | 'viewByStatus' | 'add' | 'updateStatus' | 'delete' | 'back';

// ─── Helpers ───────────────────────────────────────────────
const printHeader = (title: string): void => {
  console.log();
  console.log('─'.repeat(56));
  console.log(`  🛏️   ${title}`);
  console.log('─'.repeat(56));
  console.log();
};

const pause = async (): Promise<void> => {
  await input({ message: 'Press Enter to continue...' });
};

/** Maps RoomStatus to a coloured emoji badge for quick visual scanning */
const statusBadge = (status: RoomStatus): string => {
  switch (status) {
    case RoomStatus.Available:    return '🟢 Available  ';
    case RoomStatus.Occupied:     return '🔴 Occupied   ';
    case RoomStatus.Maintenance:  return '🟡 Maintenance';
  }
};

/** Prints a standard room table from any array of IRoom documents */
const printRoomTable = (rooms: IRoom[]): void => {
  console.log(
    `  ${'#'.padEnd(4)} ${'Room No'.padEnd(10)} ${'Type'.padEnd(14)} ${'Price/Night'.padEnd(14)} ${'Cap'.padEnd(6)} Status`
  );
  console.log(
    `  ${'─'.repeat(4)} ${'─'.repeat(10)} ${'─'.repeat(14)} ${'─'.repeat(14)} ${'─'.repeat(6)} ${'─'.repeat(16)}`
  );
  rooms.forEach((r, i) => {
    console.log(
      `  ${String(i + 1).padEnd(4)} ${r.roomNumber.padEnd(10)} ${r.roomType
        .slice(0, 13)
        .padEnd(14)} ₹${String(r.pricePerNight).padEnd(13)} ${String(r.capacity).padEnd(6)} ${statusBadge(r.status)}`
    );
  });
  console.log();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 1 — View All Rooms
// ══════════════════════════════════════════════════════════
const viewAllRooms = async (): Promise<void> => {
  printHeader('All Rooms');

  const rooms = await Room.find().sort({ roomNumber: 1 });

  if (rooms.length === 0) {
    console.log('  ⚠️   No rooms found in the database.\n');
    await pause();
    return;
  }

  printRoomTable(rooms);
  console.log(`  Total: ${rooms.length} room(s)`);
  console.log();
  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 2 — View Rooms by Status
// ══════════════════════════════════════════════════════════
const viewRoomsByStatus = async (): Promise<void> => {
  printHeader('View Rooms by Status');

  const statusChoice = await select<RoomStatus | 'back'>({
    message: 'Filter by status:',
    choices: [
      { name: '🟢  Available',    value: RoomStatus.Available   },
      { name: '🔴  Occupied',     value: RoomStatus.Occupied    },
      { name: '🟡  Maintenance',  value: RoomStatus.Maintenance },
      new Separator('─────────────────────'),
      { name: '↩   Cancel',       value: 'back'                 },
    ],
  });

  if (statusChoice === 'back') return;

  const rooms = await Room.find({ status: statusChoice }).sort({ roomNumber: 1 });

  console.log();
  if (rooms.length === 0) {
    console.log(`  ⚠️   No rooms with status "${statusChoice}" found.\n`);
    await pause();
    return;
  }

  printRoomTable(rooms);
  console.log(`  Total: ${rooms.length} room(s) with status "${statusChoice}"`);
  console.log();
  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 3 — Add Room
// ══════════════════════════════════════════════════════════
const addRoom = async (): Promise<void> => {
  printHeader('Add New Room');

  const roomNumber = await input({
    message: 'Room Number (e.g. 101, 202A):',
    validate: async (v) => {
      if (!v.trim()) return 'Room number is required.';
      const exists = await Room.findOne({ roomNumber: v.trim() });
      if (exists) return `Room number "${v.trim()}" already exists.`;
      return true;
    },
  });

  const roomType = await input({
    message: 'Room Type (e.g. Single, Double, Deluxe, Suite):',
    validate: (v) => {
      if (!v.trim()) return 'Room type is required.';
      if (v.trim().length > 50) return 'Room type cannot exceed 50 characters.';
      return true;
    },
  });

  const pricePerNightRaw = await input({
    message: 'Price Per Night (₹):',
    validate: (v) => {
      const n = Number(v);
      if (isNaN(n) || n < 0) return 'Enter a valid non-negative number.';
      return true;
    },
  });

  const capacityRaw = await input({
    message: 'Capacity (number of guests):',
    validate: (v) => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1) return 'Capacity must be a whole number of at least 1.';
      return true;
    },
  });

  const status = await select<RoomStatus>({
    message: 'Initial Status:',
    choices: [
      { name: '🟢  Available',   value: RoomStatus.Available   },
      { name: '🟡  Maintenance', value: RoomStatus.Maintenance },
    ],
  });

  // ── Review ───────────────────────────────────────────────
  console.log();
  console.log('  📋  Review Details:');
  console.log(`      Room Number   : ${roomNumber.trim()}`);
  console.log(`      Type          : ${roomType.trim()}`);
  console.log(`      Price / Night : ₹${pricePerNightRaw}`);
  console.log(`      Capacity      : ${capacityRaw} guest(s)`);
  console.log(`      Status        : ${status}`);
  console.log();

  const confirmed = await confirm({ message: 'Save this room?', default: true });

  if (!confirmed) {
    console.log('\n  ℹ️   Room creation cancelled.\n');
    await pause();
    return;
  }

  try {
    const room = await Room.create({
      roomNumber: roomNumber.trim(),
      roomType: roomType.trim(),
      pricePerNight: Number(pricePerNightRaw),
      capacity: Number(capacityRaw),
      status,
    });
    console.log(`\n  ✅  Room "${room.roomNumber}" (${room.roomType}) created successfully!`);
    console.log(`      ID: ${room._id}\n`);
  } catch (err) {
    if (err instanceof Error) console.log(`\n  ❌  Failed to create room: ${err.message}\n`);
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 4 — Update Room Status
// ══════════════════════════════════════════════════════════
const updateRoomStatus = async (): Promise<void> => {
  printHeader('Update Room Status');

  const rooms = await Room.find().sort({ roomNumber: 1 });

  if (rooms.length === 0) {
    console.log('  ⚠️   No rooms found.\n');
    await pause();
    return;
  }

  const roomChoices: ({ name: string; value: string } | InstanceType<typeof Separator>)[] =
    rooms.map((r) => ({
      name: `${r.roomNumber.padEnd(8)} ${r.roomType.padEnd(12)} ${statusBadge(r.status)}`,
      value: (r._id as { toString(): string }).toString(),
    }));
  roomChoices.push(new Separator('─────────────────────'));
  roomChoices.push({ name: '↩  Cancel', value: 'cancel' });

  const selectedId = await select<string>({
    message: 'Select room to update:',
    choices: roomChoices,
    pageSize: 12,
  });

  if (selectedId === 'cancel') return;

  const room = await Room.findById(selectedId);
  if (!room) {
    console.log('\n  ❌  Room not found.\n');
    await pause();
    return;
  }

  // Filter out current status from choices
  const newStatusChoices = Object.values(RoomStatus)
    .filter((s) => s !== room.status)
    .map((s) => ({ name: `${statusBadge(s)}`, value: s }));

  const newStatus = await select<RoomStatus>({
    message: `Current: ${statusBadge(room.status)}  →  Change to:`,
    choices: newStatusChoices,
  });

  const confirmed = await confirm({
    message: `Change Room ${room.roomNumber} status from "${room.status}" to "${newStatus}"?`,
    default: true,
  });

  if (!confirmed) {
    console.log('\n  ℹ️   Update cancelled.\n');
    await pause();
    return;
  }

  try {
    await Room.findByIdAndUpdate(selectedId, { status: newStatus });
    console.log(`\n  ✅  Room ${room.roomNumber} status updated to "${newStatus}".\n`);
  } catch (err) {
    if (err instanceof Error) console.log(`\n  ❌  Update failed: ${err.message}\n`);
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 5 — Delete Room
// ══════════════════════════════════════════════════════════
const deleteRoom = async (): Promise<void> => {
  printHeader('Delete Room');

  const rooms = await Room.find().sort({ roomNumber: 1 });

  if (rooms.length === 0) {
    console.log('  ⚠️   No rooms found to delete.\n');
    await pause();
    return;
  }

  const choices: ({ name: string; value: string } | InstanceType<typeof Separator>)[] =
    rooms.map((r) => ({
      name: `${r.roomNumber.padEnd(8)} ${r.roomType.padEnd(12)} ${statusBadge(r.status)}`,
      value: (r._id as { toString(): string }).toString(),
    }));
  choices.push(new Separator('─────────────────────'));
  choices.push({ name: '↩  Cancel', value: 'cancel' });

  const selectedId = await select<string>({
    message: 'Select room to delete:',
    choices,
    pageSize: 12,
  });

  if (selectedId === 'cancel') return;

  const room = await Room.findById(selectedId);
  if (!room) {
    console.log('\n  ❌  Room not found.\n');
    await pause();
    return;
  }

  // ── Active booking guard ─────────────────────────────────
  const Booking = (await import('../models/Booking')).default;
  const { BookingStatus } = await import('../models/Booking');

  const activeBookings = await Booking.countDocuments({
    room: selectedId,
    bookingStatus: { $in: [BookingStatus.Booked, BookingStatus.CheckedIn] },
  });

  if (activeBookings > 0) {
    console.log(
      `\n  ❌  Cannot delete Room ${room.roomNumber} — it has ${activeBookings} active booking(s).\n`
    );
    await pause();
    return;
  }

  console.log();
  console.log('  ⚠️   You are about to permanently delete:');
  console.log(`      Room   : ${room.roomNumber}  (${room.roomType})`);
  console.log(`      Price  : ₹${room.pricePerNight}/night`);
  console.log(`      Status : ${room.status}`);
  console.log();

  const confirmed = await confirm({
    message: `Delete Room "${room.roomNumber}" permanently? This cannot be undone.`,
    default: false,
  });

  if (!confirmed) {
    console.log('\n  ℹ️   Deletion cancelled.\n');
    await pause();
    return;
  }

  try {
    await Room.findByIdAndDelete(selectedId);
    console.log(`\n  ✅  Room "${room.roomNumber}" deleted successfully.\n`);
  } catch (err) {
    if (err instanceof Error) console.log(`\n  ❌  Failed to delete: ${err.message}\n`);
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  ROOM MENU LOOP
// ══════════════════════════════════════════════════════════
export const roomMenu = async (): Promise<void> => {
  let inMenu = true;

  while (inMenu) {
    console.clear();
    console.log('='.repeat(56));
    console.log('         🏨  HOTEL MANAGEMENT SYSTEM  🏨');
    console.log('='.repeat(56));

    const choice = await select<RoomMenuChoice>({
      message: '🛏️   Room Management — choose an action:',
      choices: [
        { name: '📋  View All Rooms',        value: 'view'         },
        { name: '🔍  View Rooms by Status',   value: 'viewByStatus' },
        { name: '➕  Add New Room',           value: 'add'          },
        { name: '🔄  Update Room Status',     value: 'updateStatus' },
        { name: '🗑️   Delete Room',            value: 'delete'       },
        new Separator('─────────────────────'),
        { name: '↩   Back to Main Menu',      value: 'back'         },
      ],
    });

    switch (choice) {
      case 'view':         await viewAllRooms();      break;
      case 'viewByStatus': await viewRoomsByStatus(); break;
      case 'add':          await addRoom();            break;
      case 'updateStatus': await updateRoomStatus();  break;
      case 'delete':       await deleteRoom();         break;
      case 'back':         inMenu = false;             break;
    }
  }
};
