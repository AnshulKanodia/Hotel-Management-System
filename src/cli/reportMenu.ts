import { select, input, Separator } from '@inquirer/prompts';
import mongoose from 'mongoose';
import Customer from '../models/Customer';
import Staff from '../models/Staff';
import Room from '../models/Room';
import Booking from '../models/Booking';
import { RoomStatus } from '../models/Room';
import { BookingStatus } from '../models/Booking';

/**
 * reportMenu
 * ───────────
 * Interactive CLI module for Reports & Analytics.
 * Replicates all 8 Phase 5 aggregation pipelines in a terminal-friendly
 * display — no HTTP calls, direct Mongoose aggregation.
 *
 * Reports:
 *   1. Hotel Dashboard Summary
 *   2. Room Status Report
 *   3. Booking Status Report
 *   4. Revenue Report
 *   5. Occupancy Report
 *   6. Staff by Department
 *   7. Top 5 Customers
 *   8. Customer Booking History
 *
 * File location: src/cli/reportMenu.ts
 */

type ReportMenuChoice =
  | 'dashboard'
  | 'roomStatus'
  | 'bookingStatus'
  | 'revenue'
  | 'occupancy'
  | 'staffByDept'
  | 'topCustomers'
  | 'customerHistory'
  | 'back';

// ─── Display Helpers ───────────────────────────────────────

const printHeader = (title: string): void => {
  console.log();
  console.log('═'.repeat(58));
  console.log(`  📊  ${title}`);
  console.log('═'.repeat(58));
  console.log();
};

const printDivider = (label?: string): void => {
  if (label) {
    console.log(`  ── ${label} ${'─'.repeat(Math.max(0, 48 - label.length))}`);
  } else {
    console.log('  ' + '─'.repeat(54));
  }
};

const row = (label: string, value: string | number, width = 24): void => {
  console.log(`  ${label.padEnd(width)}: ${value}`);
};

const pause = async (): Promise<void> => {
  await input({ message: 'Press Enter to continue...' });
};

const formatDate = (d: Date): string => new Date(d).toISOString().split('T')[0];

// ── Inline bar chart (max 30 chars wide) ──────────────────
const bar = (value: number, max: number, width = 28): string => {
  if (max === 0) return '░'.repeat(width);
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
};

// ══════════════════════════════════════════════════════════
//  REPORT 1 — Hotel Dashboard Summary
// ══════════════════════════════════════════════════════════
const showDashboard = async (): Promise<void> => {
  printHeader('Hotel Dashboard Summary');
  console.log('  Fetching live data from MongoDB...\n');

  const [totalCustomers, totalStaff, totalBookings, roomStatusCounts] =
    await Promise.all([
      Customer.countDocuments(),
      Staff.countDocuments(),
      Booking.countDocuments(),
      Room.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

  const roomSummary = { total: 0, available: 0, occupied: 0, maintenance: 0 };
  for (const e of roomStatusCounts as { _id: string; count: number }[]) {
    roomSummary.total += e.count;
    if (e._id === RoomStatus.Available)   roomSummary.available   = e.count;
    if (e._id === RoomStatus.Occupied)    roomSummary.occupied    = e.count;
    if (e._id === RoomStatus.Maintenance) roomSummary.maintenance = e.count;
  }

  const activeBookings = await Booking.countDocuments({
    bookingStatus: { $in: [BookingStatus.Booked, BookingStatus.CheckedIn] },
  });

  printDivider('People');
  row('👤  Total Customers', totalCustomers);
  row('👔  Total Staff',     totalStaff);
  console.log();

  printDivider('Rooms');
  row('🛏️   Total Rooms',       roomSummary.total);
  row('🟢  Available',          roomSummary.available);
  row('🔴  Occupied',           roomSummary.occupied);
  row('🟡  Maintenance',        roomSummary.maintenance);
  console.log();

  printDivider('Bookings');
  row('📅  Total Bookings',  totalBookings);
  row('⚡  Active Right Now', activeBookings);
  console.log();

  // Occupancy percentage
  const pct = roomSummary.total > 0
    ? Math.round((roomSummary.occupied / roomSummary.total) * 100)
    : 0;
  console.log(`  Occupancy Rate   : ${bar(pct, 100)} ${pct}%`);
  console.log();

  await pause();
};

// ══════════════════════════════════════════════════════════
//  REPORT 2 — Room Status Report
// ══════════════════════════════════════════════════════════
const showRoomStatus = async (): Promise<void> => {
  printHeader('Room Status Report');

  const result = await Room.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
    { $sort: { status: 1 } },
  ]) as { status: string; count: number }[];

  const total = result.reduce((s, r) => s + r.count, 0);

  if (total === 0) {
    console.log('  ⚠️   No rooms found.\n');
    await pause();
    return;
  }

  const badge: Record<string, string> = {
    Available:   '🟢',
    Occupied:    '🔴',
    Maintenance: '🟡',
  };

  const maxCount = Math.max(...result.map((r) => r.count));

  result.forEach((r) => {
    const pct = Math.round((r.count / total) * 100);
    console.log(
      `  ${badge[r.status] ?? '⚪'} ${r.status.padEnd(14)} ${String(r.count).padStart(3)} rooms  ${bar(r.count, maxCount, 20)}  ${pct}%`
    );
  });

  console.log();
  printDivider();
  row('Total Rooms', total);
  console.log();

  await pause();
};

// ══════════════════════════════════════════════════════════
//  REPORT 3 — Booking Status Report
// ══════════════════════════════════════════════════════════
const showBookingStatus = async (): Promise<void> => {
  printHeader('Booking Status Report');

  const result = await Booking.aggregate([
    { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
    { $project: { _id: 0, status: '$_id', count: 1 } },
    { $sort: { status: 1 } },
  ]) as { status: string; count: number }[];

  const total = result.reduce((s, r) => s + r.count, 0);

  if (total === 0) {
    console.log('  ⚠️   No bookings found.\n');
    await pause();
    return;
  }

  const badge: Record<string, string> = {
    Booked:     '🟡',
    CheckedIn:  '🟢',
    CheckedOut: '✅',
    Cancelled:  '🔴',
  };

  const maxCount = Math.max(...result.map((r) => r.count));

  result.forEach((r) => {
    const pct = Math.round((r.count / total) * 100);
    console.log(
      `  ${badge[r.status] ?? '⚪'} ${r.status.padEnd(14)} ${String(r.count).padStart(3)} bookings  ${bar(r.count, maxCount, 18)}  ${pct}%`
    );
  });

  console.log();
  printDivider();
  row('Total Bookings', total);
  console.log();

  await pause();
};

// ══════════════════════════════════════════════════════════
//  REPORT 4 — Revenue Report
// ══════════════════════════════════════════════════════════
const showRevenue = async (): Promise<void> => {
  printHeader('Revenue Report');

  const result = await Booking.aggregate([
    { $match: { bookingStatus: BookingStatus.CheckedOut } },
    {
      $group: {
        _id: null,
        totalRevenue:        { $sum: '$totalAmount' },
        completedBookings:   { $sum: 1 },
        averageBookingValue: { $avg: '$totalAmount' },
        maxBookingValue:     { $max: '$totalAmount' },
        minBookingValue:     { $min: '$totalAmount' },
      },
    },
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        completedBookings: 1,
        averageBookingValue: { $round: ['$averageBookingValue', 2] },
        maxBookingValue: 1,
        minBookingValue: 1,
      },
    },
  ]);

  const data = result[0] ?? {
    totalRevenue: 0,
    completedBookings: 0,
    averageBookingValue: 0,
    maxBookingValue: 0,
    minBookingValue: 0,
  };

  printDivider('Realised Revenue  (CheckedOut bookings only)');
  console.log();
  row('💰  Total Revenue',       `₹${data.totalRevenue.toLocaleString()}`);
  row('📦  Completed Bookings',  data.completedBookings);
  row('📈  Average Booking',     `₹${data.averageBookingValue.toLocaleString()}`);
  row('🔝  Highest Booking',     `₹${data.maxBookingValue.toLocaleString()}`);
  row('🔽  Lowest Booking',      `₹${data.minBookingValue.toLocaleString()}`);
  console.log();

  if (data.completedBookings === 0) {
    console.log('  ℹ️   No checked-out bookings yet — revenue will appear once guests check out.\n');
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  REPORT 5 — Occupancy Report
// ══════════════════════════════════════════════════════════
const showOccupancy = async (): Promise<void> => {
  printHeader('Room Occupancy Report');

  const result = await Room.aggregate([
    {
      $group: {
        _id: null,
        totalRooms:      { $sum: 1 },
        occupiedRooms:   { $sum: { $cond: [{ $eq: ['$status', RoomStatus.Occupied] },    1, 0] } },
        availableRooms:  { $sum: { $cond: [{ $eq: ['$status', RoomStatus.Available] },   1, 0] } },
        maintenanceRooms:{ $sum: { $cond: [{ $eq: ['$status', RoomStatus.Maintenance] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        totalRooms: 1,
        occupiedRooms: 1,
        availableRooms: 1,
        maintenanceRooms: 1,
        occupancyPercentage: {
          $round: [{ $multiply: [{ $divide: ['$occupiedRooms', '$totalRooms'] }, 100] }, 2],
        },
      },
    },
  ]);

  const d = result[0] ?? {
    totalRooms: 0, occupiedRooms: 0, availableRooms: 0,
    maintenanceRooms: 0, occupancyPercentage: 0,
  };

  row('🛏️   Total Rooms',    d.totalRooms);
  row('🔴  Occupied',        d.occupiedRooms);
  row('🟢  Available',       d.availableRooms);
  row('🟡  Maintenance',     d.maintenanceRooms);
  console.log();

  const pct: number = d.occupancyPercentage;
  const barFill = bar(pct, 100, 36);
  const indicator = pct >= 80 ? '🔴' : pct >= 50 ? '🟡' : '🟢';
  console.log(`  Occupancy Rate   : ${barFill} ${pct}% ${indicator}`);
  console.log();

  if (d.totalRooms === 0) {
    console.log('  ⚠️   No rooms found.\n');
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  REPORT 6 — Staff by Department
// ══════════════════════════════════════════════════════════
const showStaffByDept = async (): Promise<void> => {
  printHeader('Staff by Department');

  const result = await Staff.aggregate([
    { $group: { _id: '$department', totalStaff: { $sum: 1 } } },
    {
      $lookup: {
        from: 'departments',
        localField: '_id',
        foreignField: '_id',
        as: 'deptInfo',
      },
    },
    {
      $project: {
        _id: 0,
        department:  { $arrayElemAt: ['$deptInfo.name', 0] },
        description: { $arrayElemAt: ['$deptInfo.description', 0] },
        totalStaff:  1,
      },
    },
    { $sort: { totalStaff: -1 } },
  ]) as { department: string; description: string; totalStaff: number }[];

  if (result.length === 0) {
    console.log('  ⚠️   No staff or department data found.\n');
    await pause();
    return;
  }

  const maxStaff = Math.max(...result.map((r) => r.totalStaff));

  console.log(`  ${'Department'.padEnd(20)} ${'Staff'.padEnd(7)} Bar`);
  console.log(`  ${'─'.repeat(20)} ${'─'.repeat(7)} ${'─'.repeat(22)}`);

  result.forEach((r) => {
    console.log(
      `  ${(r.department ?? '—').slice(0, 19).padEnd(20)} ${String(r.totalStaff).padEnd(7)} ${bar(r.totalStaff, maxStaff, 22)}`
    );
  });

  const totalStaff = result.reduce((s, r) => s + r.totalStaff, 0);
  console.log();
  printDivider();
  row('Total Staff', totalStaff);
  console.log();

  await pause();
};

// ══════════════════════════════════════════════════════════
//  REPORT 7 — Top 5 Customers
// ══════════════════════════════════════════════════════════
const showTopCustomers = async (): Promise<void> => {
  printHeader('Top 5 Customers by Bookings');

  const result = await Booking.aggregate([
    { $group: { _id: '$customer', totalBookings: { $sum: 1 }, totalSpend: { $sum: '$totalAmount' } } },
    { $sort: { totalBookings: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customerInfo',
      },
    },
    {
      $project: {
        _id: 0,
        name:          { $arrayElemAt: ['$customerInfo.name', 0] },
        email:         { $arrayElemAt: ['$customerInfo.email', 0] },
        phone:         { $arrayElemAt: ['$customerInfo.phone', 0] },
        totalBookings: 1,
        totalSpend:    1,
      },
    },
  ]) as { name: string; email: string; phone: string; totalBookings: number; totalSpend: number }[];

  if (result.length === 0) {
    console.log('  ⚠️   No booking data found.\n');
    await pause();
    return;
  }

  console.log(
    `  ${'#'.padEnd(4)} ${'Name'.padEnd(20)} ${'Bookings'.padEnd(10)} ${'Total Spend'.padEnd(14)} Email`
  );
  console.log(
    `  ${'─'.repeat(4)} ${'─'.repeat(20)} ${'─'.repeat(10)} ${'─'.repeat(14)} ${'─'.repeat(26)}`
  );

  const medals = ['🥇', '🥈', '🥉', '  ', '  '];
  result.forEach((r, i) => {
    console.log(
      `  ${medals[i]} ${String(i + 1).padEnd(2)} ${(r.name ?? '—').slice(0, 19).padEnd(20)} ${String(r.totalBookings).padEnd(10)} ₹${String(r.totalSpend).padEnd(13)} ${r.email ?? '—'}`
    );
  });

  console.log();
  await pause();
};

// ══════════════════════════════════════════════════════════
//  REPORT 8 — Customer Booking History
// ══════════════════════════════════════════════════════════
const showCustomerHistory = async (): Promise<void> => {
  printHeader('Customer Booking History');

  const customers = await Customer.find().sort({ name: 1 });

  if (customers.length === 0) {
    console.log('  ⚠️   No customers found.\n');
    await pause();
    return;
  }

  const choices: ({ name: string; value: string } | InstanceType<typeof Separator>)[] =
    customers.map((c) => ({
      name: `${c.name}  <${c.email}>`,
      value: (c._id as { toString(): string }).toString(),
    }));
  choices.push(new Separator('─────────────────────'));
  choices.push({ name: '↩  Cancel', value: 'cancel' });

  const customerId = await select<string>({
    message: 'Select customer:',
    choices,
    pageSize: 10,
  });

  if (customerId === 'cancel') return;

  const customer = customers.find(
    (c) => (c._id as { toString(): string }).toString() === customerId
  )!;

  const bookings = await Booking.aggregate([
    { $match: { customer: new mongoose.Types.ObjectId(customerId) } },
    {
      $lookup: {
        from: 'rooms',
        localField: 'room',
        foreignField: '_id',
        as: 'roomInfo',
      },
    },
    {
      $project: {
        _id: 1,
        checkInDate: 1,
        checkOutDate: 1,
        totalAmount: 1,
        bookingStatus: 1,
        room: { $arrayElemAt: ['$roomInfo', 0] },
      },
    },
    { $sort: { checkInDate: -1 } },
  ]) as {
    _id: mongoose.Types.ObjectId;
    checkInDate: Date;
    checkOutDate: Date;
    totalAmount: number;
    bookingStatus: BookingStatus;
    room: { roomNumber: string; roomType: string; pricePerNight: number } | null;
  }[];

  console.log();
  printDivider('Customer Profile');
  row('Name',     customer.name);
  row('Email',    customer.email);
  row('Phone',    customer.phone);
  row('Address',  customer.address);
  console.log();

  if (bookings.length === 0) {
    console.log('  ℹ️   This customer has no bookings yet.\n');
    await pause();
    return;
  }

  printDivider(`Booking History  (${bookings.length} booking(s))`);
  console.log();

  const statusBadge: Record<string, string> = {
    Booked: '🟡', CheckedIn: '🟢', CheckedOut: '✅', Cancelled: '🔴',
  };

  bookings.forEach((b, i) => {
    const nights = Math.ceil(
      (new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / 86400000
    );
    console.log(
      `  ${String(i + 1).padEnd(3)} ${statusBadge[b.bookingStatus] ?? '⚪'} ${b.bookingStatus.padEnd(13)} ` +
      `Room ${(b.room?.roomNumber ?? '—').padEnd(8)} ` +
      `${formatDate(b.checkInDate)} → ${formatDate(b.checkOutDate)}  ` +
      `${nights}n  ₹${b.totalAmount}`
    );
  });

  const totalSpend = bookings.reduce((s, b) => s + b.totalAmount, 0);
  console.log();
  printDivider();
  row('Total Bookings', bookings.length);
  row('Total Spend',    `₹${totalSpend.toLocaleString()}`);
  console.log();

  await pause();
};

// ══════════════════════════════════════════════════════════
//  REPORT MENU LOOP
// ══════════════════════════════════════════════════════════
export const reportMenu = async (): Promise<void> => {
  let inMenu = true;

  while (inMenu) {
    console.clear();
    console.log('='.repeat(58));
    console.log('         🏨  HOTEL MANAGEMENT SYSTEM  🏨');
    console.log('='.repeat(58));

    const choice = await select<ReportMenuChoice>({
      message: '📊  Reports & Analytics — choose a report:',
      choices: [
        { name: '🏠  Hotel Dashboard Summary',        value: 'dashboard'       },
        { name: '🛏️   Room Status Report',             value: 'roomStatus'      },
        { name: '📅  Booking Status Report',          value: 'bookingStatus'   },
        { name: '💰  Revenue Report',                 value: 'revenue'         },
        { name: '📈  Occupancy Report',               value: 'occupancy'       },
        { name: '👔  Staff by Department',            value: 'staffByDept'     },
        { name: '🏆  Top 5 Customers',                value: 'topCustomers'    },
        { name: '🔍  Customer Booking History',       value: 'customerHistory' },
        new Separator('─────────────────────'),
        { name: '↩   Back to Main Menu',              value: 'back'            },
      ],
    });

    switch (choice) {
      case 'dashboard':       await showDashboard();        break;
      case 'roomStatus':      await showRoomStatus();       break;
      case 'bookingStatus':   await showBookingStatus();    break;
      case 'revenue':         await showRevenue();          break;
      case 'occupancy':       await showOccupancy();        break;
      case 'staffByDept':     await showStaffByDept();      break;
      case 'topCustomers':    await showTopCustomers();     break;
      case 'customerHistory': await showCustomerHistory();  break;
      case 'back':            inMenu = false;               break;
    }
  }
};
