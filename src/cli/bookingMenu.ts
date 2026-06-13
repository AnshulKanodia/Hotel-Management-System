import { select, input, confirm, Separator } from '@inquirer/prompts';
import Booking, { IBooking, BookingStatus } from '../models/Booking';
import Room, { IRoom, RoomStatus } from '../models/Room';
import Customer, { ICustomer } from '../models/Customer';

/**
 * bookingMenu
 * ────────────
 * Interactive CLI module for Booking Management.
 *
 * Features:
 *   1. View All Bookings     — full table with customer + room populated
 *   2. Create Booking        — pick customer, pick available room, enter dates
 *                              auto-calculates totalAmount, conflict detection
 *   3. Check In              — Booked → CheckedIn
 *   4. Check Out             — CheckedIn → CheckedOut, frees room
 *   5. Cancel Booking        — soft delete, frees room
 *   6. View Booking Details  — single booking full breakdown
 *
 * File location: src/cli/bookingMenu.ts
 */

type BookingMenuChoice =
  | 'view'
  | 'create'
  | 'checkin'
  | 'checkout'
  | 'cancel'
  | 'details'
  | 'back';

// ─── Populated types ───────────────────────────────────────
type PopulatedBooking = Omit<IBooking, 'customer' | 'room'> & {
  customer: ICustomer | null;
  room: IRoom | null;
};

// ─── Helpers ───────────────────────────────────────────────
const printHeader = (title: string): void => {
  console.log();
  console.log('─'.repeat(62));
  console.log(`  📅  ${title}`);
  console.log('─'.repeat(62));
  console.log();
};

const pause = async (): Promise<void> => {
  await input({ message: 'Press Enter to continue...' });
};

/** Status badge for quick visual scanning */
const statusBadge = (status: BookingStatus): string => {
  switch (status) {
    case BookingStatus.Booked:     return '🟡 Booked    ';
    case BookingStatus.CheckedIn:  return '🟢 CheckedIn ';
    case BookingStatus.CheckedOut: return '✅ CheckedOut';
    case BookingStatus.Cancelled:  return '🔴 Cancelled ';
  }
};

/** Format a Date object to YYYY-MM-DD string */
const formatDate = (d: Date): string => d.toISOString().split('T')[0];

/** Calculate number of nights between two dates */
const calcNights = (checkIn: Date, checkOut: Date): number =>
  Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

/**
 * Check for overlapping bookings for a given room + date range.
 * Returns the conflicting booking if found, null otherwise.
 */
const findConflict = async (
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeId?: string
): Promise<PopulatedBooking | null> => {
  const query: Record<string, unknown> = {
    room: roomId,
    bookingStatus: { $in: [BookingStatus.Booked, BookingStatus.CheckedIn] },
    checkInDate: { $lt: checkOut },
    checkOutDate: { $gt: checkIn },
  };
  if (excludeId) query._id = { $ne: excludeId };

  return Booking.findOne(query)
    .populate('customer', 'name')
    .populate('room', 'roomNumber') as unknown as Promise<PopulatedBooking | null>;
};

// ══════════════════════════════════════════════════════════
//  FEATURE 1 — View All Bookings
// ══════════════════════════════════════════════════════════
const viewAllBookings = async (): Promise<void> => {
  printHeader('All Bookings');

  const bookings = await Booking.find()
    .populate('customer', 'name email')
    .populate('room', 'roomNumber roomType')
    .sort({ createdAt: -1 }) as unknown as PopulatedBooking[];

  if (bookings.length === 0) {
    console.log('  ⚠️   No bookings found.\n');
    await pause();
    return;
  }

  console.log(
    `  ${'#'.padEnd(4)} ${'Customer'.padEnd(18)} ${'Room'.padEnd(10)} ${'Check-In'.padEnd(13)} ${'Check-Out'.padEnd(13)} ${'Amount'.padEnd(10)} Status`
  );
  console.log(
    `  ${'─'.repeat(4)} ${'─'.repeat(18)} ${'─'.repeat(10)} ${'─'.repeat(13)} ${'─'.repeat(13)} ${'─'.repeat(10)} ${'─'.repeat(14)}`
  );

  bookings.forEach((b, i) => {
    const custName = b.customer ? b.customer.name.slice(0, 17) : '—';
    const roomNo   = b.room ? b.room.roomNumber : '—';
    console.log(
      `  ${String(i + 1).padEnd(4)} ${custName.padEnd(18)} ${roomNo.padEnd(10)} ${formatDate(
        b.checkInDate
      ).padEnd(13)} ${formatDate(b.checkOutDate).padEnd(13)} ₹${String(b.totalAmount).padEnd(9)} ${statusBadge(
        b.bookingStatus
      )}`
    );
  });

  console.log();
  console.log(`  Total: ${bookings.length} booking(s)`);
  console.log();
  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 2 — Create Booking
// ══════════════════════════════════════════════════════════
const createBooking = async (): Promise<void> => {
  printHeader('Create New Booking');

  // ── Step 1: Pick customer ────────────────────────────────
  const customers = await Customer.find().sort({ name: 1 });
  if (customers.length === 0) {
    console.log('  ⚠️   No customers found. Add a customer first.\n');
    await pause();
    return;
  }

  const custChoices: ({ name: string; value: string } | InstanceType<typeof Separator>)[] =
    customers.map((c) => ({
      name: `${c.name}  <${c.email}>`,
      value: (c._id as { toString(): string }).toString(),
    }));
  custChoices.push(new Separator('─────────────────────'));
  custChoices.push({ name: '↩  Cancel', value: 'cancel' });

  const customerId = await select<string>({
    message: 'Step 1/4 — Select Customer:',
    choices: custChoices,
    pageSize: 10,
  });
  if (customerId === 'cancel') return;

  // ── Step 2: Enter dates ──────────────────────────────────
  const checkInRaw = await input({
    message: 'Step 2/4 — Check-In Date (YYYY-MM-DD):',
    validate: (v) => {
      if (!v.trim()) return 'Date is required.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return 'Use format YYYY-MM-DD.';
      if (isNaN(new Date(v.trim()).getTime())) return 'Invalid date.';
      return true;
    },
  });

  const checkOutRaw = await input({
    message: 'Step 3/4 — Check-Out Date (YYYY-MM-DD):',
    validate: (v) => {
      if (!v.trim()) return 'Date is required.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return 'Use format YYYY-MM-DD.';
      if (isNaN(new Date(v.trim()).getTime())) return 'Invalid date.';
      if (new Date(v.trim()) <= new Date(checkInRaw.trim()))
        return 'Check-out must be after check-in.';
      return true;
    },
  });

  const checkIn  = new Date(checkInRaw.trim());
  const checkOut = new Date(checkOutRaw.trim());
  const nights   = calcNights(checkIn, checkOut);

  // ── Step 3: Pick available room ──────────────────────────
  // Only show rooms that are Available AND have no date conflict
  const allAvailableRooms = await Room.find({ status: RoomStatus.Available }).sort({ roomNumber: 1 });

  if (allAvailableRooms.length === 0) {
    console.log('\n  ⚠️   No available rooms right now.\n');
    await pause();
    return;
  }

  // Filter further by date conflicts
  const freeRooms: IRoom[] = [];
  for (const r of allAvailableRooms) {
    const conflict = await findConflict(
      (r._id as { toString(): string }).toString(),
      checkIn,
      checkOut
    );
    if (!conflict) freeRooms.push(r);
  }

  if (freeRooms.length === 0) {
    console.log('\n  ❌  No rooms available for the selected dates.\n');
    await pause();
    return;
  }

  const roomChoices: ({ name: string; value: string } | InstanceType<typeof Separator>)[] =
    freeRooms.map((r) => ({
      name: `Room ${r.roomNumber.padEnd(8)} ${r.roomType.padEnd(14)} ₹${r.pricePerNight}/night  (cap: ${r.capacity})`,
      value: (r._id as { toString(): string }).toString(),
    }));
  roomChoices.push(new Separator('─────────────────────'));
  roomChoices.push({ name: '↩  Cancel', value: 'cancel' });

  const roomId = await select<string>({
    message: `Step 4/4 — Select Room  (${nights} night${nights > 1 ? 's' : ''}):`,
    choices: roomChoices,
    pageSize: 12,
  });
  if (roomId === 'cancel') return;

  const room     = freeRooms.find((r) => (r._id as { toString(): string }).toString() === roomId)!;
  const customer = customers.find((c) => (c._id as { toString(): string }).toString() === customerId)!;
  const total    = nights * room.pricePerNight;

  // ── Review ───────────────────────────────────────────────
  console.log();
  console.log('  📋  Booking Summary:');
  console.log(`      Customer     : ${customer.name}  <${customer.email}>`);
  console.log(`      Room         : ${room.roomNumber}  (${room.roomType})`);
  console.log(`      Check-In     : ${formatDate(checkIn)}`);
  console.log(`      Check-Out    : ${formatDate(checkOut)}`);
  console.log(`      Nights       : ${nights}`);
  console.log(`      Rate         : ₹${room.pricePerNight}/night`);
  console.log(`      Total Amount : ₹${total}`);
  console.log();

  const confirmed = await confirm({ message: 'Confirm and create booking?', default: true });
  if (!confirmed) {
    console.log('\n  ℹ️   Booking cancelled.\n');
    await pause();
    return;
  }

  try {
    const booking = await Booking.create({
      customer: customerId,
      room: roomId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalAmount: total,
      bookingStatus: BookingStatus.Booked,
    });

    // Mark room as Occupied
    await Room.findByIdAndUpdate(roomId, { status: RoomStatus.Occupied });

    console.log(`\n  ✅  Booking created successfully!`);
    console.log(`      Booking ID : ${booking._id}`);
    console.log(`      Status     : ${booking.bookingStatus}`);
    console.log(`      Total      : ₹${booking.totalAmount}\n`);
  } catch (err) {
    if (err instanceof Error) console.log(`\n  ❌  Failed to create booking: ${err.message}\n`);
  }

  await pause();
};

// ── Shared helper: pick a booking filtered by status(es) ──
const pickBooking = async (
  message: string,
  statuses: BookingStatus[]
): Promise<PopulatedBooking | null> => {
  const bookings = await Booking.find({ bookingStatus: { $in: statuses } })
    .populate('customer', 'name')
    .populate('room', 'roomNumber roomType')
    .sort({ checkInDate: 1 }) as unknown as PopulatedBooking[];

  if (bookings.length === 0) return null;

  const choices: ({ name: string; value: string } | InstanceType<typeof Separator>)[] =
    bookings.map((b) => ({
      name: `${(b.customer?.name ?? '—').padEnd(20)} Room ${(b.room?.roomNumber ?? '—').padEnd(8)} ${formatDate(b.checkInDate)} → ${formatDate(b.checkOutDate)}  ${statusBadge(b.bookingStatus)}`,
      value: (b._id as { toString(): string }).toString(),
    }));
  choices.push(new Separator('─────────────────────'));
  choices.push({ name: '↩  Cancel', value: 'cancel' });

  const selectedId = await select<string>({ message, choices, pageSize: 10 });
  if (selectedId === 'cancel') return null;

  return bookings.find(
    (b) => (b._id as { toString(): string }).toString() === selectedId
  ) ?? null;
};

// ══════════════════════════════════════════════════════════
//  FEATURE 3 — Check In
// ══════════════════════════════════════════════════════════
const checkIn = async (): Promise<void> => {
  printHeader('Check In Guest');

  const booking = await pickBooking(
    'Select booking to check in:',
    [BookingStatus.Booked]
  );

  if (!booking) {
    const hasBooked = await Booking.countDocuments({ bookingStatus: BookingStatus.Booked });
    console.log(hasBooked === 0
      ? '\n  ⚠️   No bookings with status "Booked" found.\n'
      : '\n  ℹ️   Check-in cancelled.\n'
    );
    await pause();
    return;
  }

  console.log();
  console.log(`  Guest  : ${booking.customer?.name}`);
  console.log(`  Room   : ${booking.room?.roomNumber}  (${booking.room?.roomType})`);
  console.log(`  Dates  : ${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)}`);
  console.log();

  const confirmed = await confirm({ message: 'Confirm check-in?', default: true });
  if (!confirmed) {
    console.log('\n  ℹ️   Cancelled.\n');
    await pause();
    return;
  }

  try {
    await Booking.findByIdAndUpdate(
      (booking._id as { toString(): string }).toString(),
      { bookingStatus: BookingStatus.CheckedIn }
    );
    console.log(`\n  ✅  ${booking.customer?.name} checked in to Room ${booking.room?.roomNumber}.\n`);
  } catch (err) {
    if (err instanceof Error) console.log(`\n  ❌  Check-in failed: ${err.message}\n`);
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 4 — Check Out
// ══════════════════════════════════════════════════════════
const checkOut = async (): Promise<void> => {
  printHeader('Check Out Guest');

  const booking = await pickBooking(
    'Select booking to check out:',
    [BookingStatus.CheckedIn]
  );

  if (!booking) {
    const hasCheckedIn = await Booking.countDocuments({ bookingStatus: BookingStatus.CheckedIn });
    console.log(hasCheckedIn === 0
      ? '\n  ⚠️   No bookings with status "CheckedIn" found.\n'
      : '\n  ℹ️   Check-out cancelled.\n'
    );
    await pause();
    return;
  }

  const nights = calcNights(booking.checkInDate, booking.checkOutDate);

  console.log();
  console.log(`  Guest  : ${booking.customer?.name}`);
  console.log(`  Room   : ${booking.room?.roomNumber}  (${booking.room?.roomType})`);
  console.log(`  Nights : ${nights}`);
  console.log(`  Total  : ₹${booking.totalAmount}`);
  console.log();

  const confirmed = await confirm({ message: 'Confirm check-out?', default: true });
  if (!confirmed) {
    console.log('\n  ℹ️   Cancelled.\n');
    await pause();
    return;
  }

  try {
    await Booking.findByIdAndUpdate(
      (booking._id as { toString(): string }).toString(),
      { bookingStatus: BookingStatus.CheckedOut }
    );
    // Free the room
    if (booking.room) {
      await Room.findByIdAndUpdate(
        (booking.room._id as { toString(): string }).toString(),
        { status: RoomStatus.Available }
      );
    }
    console.log(
      `\n  ✅  ${booking.customer?.name} checked out. Room ${booking.room?.roomNumber} is now Available.\n`
    );
  } catch (err) {
    if (err instanceof Error) console.log(`\n  ❌  Check-out failed: ${err.message}\n`);
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 5 — Cancel Booking
// ══════════════════════════════════════════════════════════
const cancelBooking = async (): Promise<void> => {
  printHeader('Cancel Booking');

  const booking = await pickBooking(
    'Select booking to cancel:',
    [BookingStatus.Booked, BookingStatus.CheckedIn]
  );

  if (!booking) {
    const hasActive = await Booking.countDocuments({
      bookingStatus: { $in: [BookingStatus.Booked, BookingStatus.CheckedIn] },
    });
    console.log(hasActive === 0
      ? '\n  ⚠️   No active bookings found to cancel.\n'
      : '\n  ℹ️   Cancellation aborted.\n'
    );
    await pause();
    return;
  }

  console.log();
  console.log(`  Guest  : ${booking.customer?.name}`);
  console.log(`  Room   : ${booking.room?.roomNumber}  (${booking.room?.roomType})`);
  console.log(`  Dates  : ${formatDate(booking.checkInDate)} → ${formatDate(booking.checkOutDate)}`);
  console.log(`  Status : ${statusBadge(booking.bookingStatus)}`);
  console.log(`  Amount : ₹${booking.totalAmount}`);
  console.log();

  const confirmed = await confirm({
    message: 'Cancel this booking? (Soft delete — record is kept)',
    default: false,
  });

  if (!confirmed) {
    console.log('\n  ℹ️   Cancellation aborted.\n');
    await pause();
    return;
  }

  try {
    await Booking.findByIdAndUpdate(
      (booking._id as { toString(): string }).toString(),
      { bookingStatus: BookingStatus.Cancelled }
    );
    // Free the room regardless of current booking status
    if (booking.room) {
      await Room.findByIdAndUpdate(
        (booking.room._id as { toString(): string }).toString(),
        { status: RoomStatus.Available }
      );
    }
    console.log(
      `\n  ✅  Booking cancelled. Room ${booking.room?.roomNumber} is now Available.\n`
    );
  } catch (err) {
    if (err instanceof Error) console.log(`\n  ❌  Cancellation failed: ${err.message}\n`);
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 6 — View Booking Details
// ══════════════════════════════════════════════════════════
const viewBookingDetails = async (): Promise<void> => {
  printHeader('View Booking Details');

  const bookings = await Booking.find()
    .populate('customer', 'name email phone')
    .populate('room', 'roomNumber roomType pricePerNight capacity')
    .sort({ createdAt: -1 }) as unknown as PopulatedBooking[];

  if (bookings.length === 0) {
    console.log('  ⚠️   No bookings found.\n');
    await pause();
    return;
  }

  const choices: ({ name: string; value: string } | InstanceType<typeof Separator>)[] =
    bookings.map((b) => ({
      name: `${(b.customer?.name ?? '—').padEnd(20)} Room ${(b.room?.roomNumber ?? '—').padEnd(8)} ${formatDate(b.checkInDate)}  ${statusBadge(b.bookingStatus)}`,
      value: (b._id as { toString(): string }).toString(),
    }));
  choices.push(new Separator('─────────────────────'));
  choices.push({ name: '↩  Cancel', value: 'cancel' });

  const selectedId = await select<string>({
    message: 'Select booking to view:',
    choices,
    pageSize: 12,
  });

  if (selectedId === 'cancel') return;

  const b = bookings.find(
    (bk) => (bk._id as { toString(): string }).toString() === selectedId
  );

  if (!b) {
    console.log('\n  ❌  Booking not found.\n');
    await pause();
    return;
  }

  const nights = calcNights(b.checkInDate, b.checkOutDate);

  console.log();
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║           BOOKING DETAILS                ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log();
  console.log(`  Booking ID   : ${(b._id as { toString(): string }).toString()}`);
  console.log(`  Status       : ${statusBadge(b.bookingStatus)}`);
  console.log();
  console.log('  ── Customer ─────────────────────────────────');
  console.log(`  Name         : ${b.customer?.name ?? '—'}`);
  console.log(`  Email        : ${b.customer?.email ?? '—'}`);
  console.log(`  Phone        : ${b.customer?.phone ?? '—'}`);
  console.log();
  console.log('  ── Room ─────────────────────────────────────');
  console.log(`  Room Number  : ${b.room?.roomNumber ?? '—'}`);
  console.log(`  Type         : ${b.room?.roomType ?? '—'}`);
  console.log(`  Price/Night  : ₹${b.room?.pricePerNight ?? '—'}`);
  console.log();
  console.log('  ── Stay ─────────────────────────────────────');
  console.log(`  Check-In     : ${formatDate(b.checkInDate)}`);
  console.log(`  Check-Out    : ${formatDate(b.checkOutDate)}`);
  console.log(`  Nights       : ${nights}`);
  console.log(`  Total Amount : ₹${b.totalAmount}`);
  console.log(`  Created At   : ${b.createdAt.toLocaleString()}`);
  console.log();

  await pause();
};

// ══════════════════════════════════════════════════════════
//  BOOKING MENU LOOP
// ══════════════════════════════════════════════════════════
export const bookingMenu = async (): Promise<void> => {
  let inMenu = true;

  while (inMenu) {
    console.clear();
    console.log('='.repeat(62));
    console.log('           🏨  HOTEL MANAGEMENT SYSTEM  🏨');
    console.log('='.repeat(62));

    const choice = await select<BookingMenuChoice>({
      message: '📅  Booking Management — choose an action:',
      choices: [
        { name: '📋  View All Bookings',    value: 'view'     },
        { name: '➕  Create Booking',       value: 'create'   },
        { name: '🟢  Check In Guest',       value: 'checkin'  },
        { name: '✅  Check Out Guest',      value: 'checkout' },
        { name: '🔴  Cancel Booking',       value: 'cancel'   },
        { name: '🔍  View Booking Details', value: 'details'  },
        new Separator('─────────────────────'),
        { name: '↩   Back to Main Menu',   value: 'back'     },
      ],
    });

    switch (choice) {
      case 'view':     await viewAllBookings();   break;
      case 'create':   await createBooking();     break;
      case 'checkin':  await checkIn();           break;
      case 'checkout': await checkOut();          break;
      case 'cancel':   await cancelBooking();     break;
      case 'details':  await viewBookingDetails(); break;
      case 'back':     inMenu = false;            break;
    }
  }
};
