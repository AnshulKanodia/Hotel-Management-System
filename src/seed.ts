import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

import connectDB from './config/db';
import Department from './models/Department';
import Room, { RoomStatus } from './models/Room';
import Customer from './models/Customer';
import Staff from './models/Staff';
import Booking, { BookingStatus } from './models/Booking';
import mongoose from 'mongoose';

const seedDatabase = async () => {
  try {
    // 1. Connect to DB
    await connectDB();

    console.log('🧹 Clearing existing database collections...');
    await Promise.all([
      Department.deleteMany({}),
      Room.deleteMany({}),
      Customer.deleteMany({}),
      Staff.deleteMany({}),
      Booking.deleteMany({}),
    ]);
    console.log('✅ Collections cleared.');

    // 2. Seed 7 Departments
    console.log('🌱 Seeding 7 Departments...');
    const depts = await Department.create([
      { name: 'Front Office', description: 'Handles check-ins, check-outs, reservations, and customer support.' },
      { name: 'Housekeeping', description: 'Maintains room cleanliness, laundry services, and corridor neatness.' },
      { name: 'Food & Beverage', description: 'Manages hotel kitchen, restaurant service, room food orders, and bar.' },
      { name: 'Security & Safety', description: 'Protects guests, staff, and hotel property through 24/7 patrol.' },
      { name: 'Maintenance & IT', description: 'Repairs plumbing, electrical issues, HVAC systems, and hotel Wi-Fi.' },
      { name: 'Sales & Marketing', description: 'Handles booking contracts, event halls, website promotions, and corporate rates.' },
      { name: 'Human Resources', description: 'Manages staff recruitment, payroll, benefits, and employee relations.' }
    ]);
    console.log(`✅ ${depts.length} Departments created.`);

    // 3. Seed 20 Rooms (6-7 per type)
    console.log('🌱 Seeding 20 Rooms...');
    const roomTemplates = [
      // 6 Single Rooms (100 price, 1 capacity)
      { roomNumber: '101', roomType: 'Single', pricePerNight: 100, capacity: 1, status: RoomStatus.Occupied },
      { roomNumber: '102', roomType: 'Single', pricePerNight: 100, capacity: 1, status: RoomStatus.Occupied },
      { roomNumber: '103', roomType: 'Single', pricePerNight: 100, capacity: 1, status: RoomStatus.Available },
      { roomNumber: '104', roomType: 'Single', pricePerNight: 105, capacity: 1, status: RoomStatus.Available },
      { roomNumber: '105', roomType: 'Single', pricePerNight: 105, capacity: 1, status: RoomStatus.Maintenance },
      { roomNumber: '106', roomType: 'Single', pricePerNight: 110, capacity: 1, status: RoomStatus.Available },

      // 6 Double Rooms (180 price, 2 capacity)
      { roomNumber: '201', roomType: 'Double', pricePerNight: 180, capacity: 2, status: RoomStatus.Occupied },
      { roomNumber: '202', roomType: 'Double', pricePerNight: 180, capacity: 2, status: RoomStatus.Available },
      { roomNumber: '203', roomType: 'Double', pricePerNight: 180, capacity: 2, status: RoomStatus.Available },
      { roomNumber: '204', roomType: 'Double', pricePerNight: 190, capacity: 2, status: RoomStatus.Available },
      { roomNumber: '205', roomType: 'Double', pricePerNight: 190, capacity: 2, status: RoomStatus.Maintenance },
      { roomNumber: '206', roomType: 'Double', pricePerNight: 200, capacity: 2, status: RoomStatus.Available },

      // 5 Deluxe Rooms (280 price, 2 capacity)
      { roomNumber: '301', roomType: 'Deluxe', pricePerNight: 280, capacity: 2, status: RoomStatus.Available },
      { roomNumber: '302', roomType: 'Deluxe', pricePerNight: 280, capacity: 2, status: RoomStatus.Available },
      { roomNumber: '303', roomType: 'Deluxe', pricePerNight: 290, capacity: 2, status: RoomStatus.Available },
      { roomNumber: '304', roomType: 'Deluxe', pricePerNight: 290, capacity: 2, status: RoomStatus.Available },
      { roomNumber: '305', roomType: 'Deluxe', pricePerNight: 300, capacity: 2, status: RoomStatus.Maintenance },

      // 3 Suite Rooms (500 price, 4 capacity)
      { roomNumber: '401', roomType: 'Suite', pricePerNight: 500, capacity: 4, status: RoomStatus.Available },
      { roomNumber: '402', roomType: 'Suite', pricePerNight: 520, capacity: 4, status: RoomStatus.Available },
      { roomNumber: '403', roomType: 'Suite', pricePerNight: 550, capacity: 4, status: RoomStatus.Available }
    ];
    
    const rooms = await Room.create(roomTemplates);
    console.log(`✅ ${rooms.length} Rooms created.`);

    // 4. Seed 15 Customers
    console.log('🌱 Seeding 15 Customers...');
    const customerTemplates = [
      { name: 'Alice Johnson', email: 'alice.j@example.com', phone: '9876543210', address: '742 Evergreen Terr, Springfield', idProof: 'Passport - US123456' },
      { name: 'Bob Smith', email: 'bob.smith@example.com', phone: '9876543211', address: '221B Baker St, London', idProof: 'Aadhar - 987654321098' },
      { name: 'Charlie Brown', email: 'charlie.b@example.com', phone: '9876543212', address: '123 Maple St, Peanutsville', idProof: 'Driver Lic - DL987654' },
      { name: 'Diana Prince', email: 'diana@justice.org', phone: '9876543213', address: 'Themyscira Embassy, Metropolis', idProof: 'Gov ID - WW1941' },
      { name: 'Evan Wright', email: 'evan.w@example.com', phone: '9876543214', address: '456 Oak Ave, Seattle', idProof: 'Passport - CA987654' },
      { name: 'Fiona Gallagher', email: 'fiona.g@example.com', phone: '9876543215', address: '2119 S Homan Ave, Chicago', idProof: 'Driver Lic - IL11223' },
      { name: 'George Clooney', email: 'george@villa.it', phone: '9876543216', address: 'Lake Como Villa, Italy', idProof: 'Passport - IT554433' },
      { name: 'Hannah Abbott', email: 'hannah.a@hogwarts.edu', phone: '9876543217', address: 'Leaky Cauldron, London', idProof: 'Wiz Card - HA009' },
      { name: 'Ian Malcolm', email: 'chaos.theory@jurassic.com', phone: '9876543218', address: '101 Dinosaur Rd, Costa Rica', idProof: 'Driver Lic - TX9988' },
      { name: 'Julia Roberts', email: 'julia@prettywoman.com', phone: '9876543219', address: 'Beverly Hills Hotel, LA', idProof: 'State ID - CA7766' },
      { name: 'Kevin Bacon', email: 'six.degrees@hollywood.com', phone: '9876543201', address: '12 Degrees St, Philadelphia', idProof: 'Gov ID - PA1234' },
      { name: 'Laura Croft', email: 'tomb.raider@manor.co.uk', phone: '9876543202', address: 'Croft Manor, Surrey', idProof: 'Passport - UK776655' },
      { name: 'Michael Scott', email: 'mscott@dundermifflin.com', phone: '9876543203', address: '1725 Slough Ave, Scranton', idProof: 'Dunder Card - DM001' },
      { name: 'Natalie Portman', email: 'natalie@harvard.edu', phone: '9876543204', address: '50 Wall St, New York', idProof: 'Passport - NY9090' },
      { name: 'Oliver Twist', email: 'oliver.t@orphanage.org', phone: '9876543205', address: 'Workhouse Row, London', idProof: 'Birth Cert - OT1838' }
    ];

    const customers = await Customer.create(customerTemplates);
    console.log(`✅ ${customers.length} Customers created.`);

    // 5. Seed 14 Staff (2 per department, 10-15 total)
    console.log('🌱 Seeding 14 Staff...');
    const staffTemplates = [
      // Front Office
      { name: 'Emma Watson', email: 'emma@hotel.com', phone: '9876543220', role: 'Receptionist', salary: 3200, department: depts[0]._id },
      { name: 'David Miller', email: 'david@hotel.com', phone: '9876543221', role: 'Front Desk Manager', salary: 6500, department: depts[0]._id },

      // Housekeeping
      { name: 'Sarah Connor', email: 'sarah@hotel.com', phone: '9876543222', role: 'Head of Housekeeping', salary: 3800, department: depts[1]._id },
      { name: 'John Doe', email: 'john.d@hotel.com', phone: '9876543223', role: 'Housekeeper', salary: 2500, department: depts[1]._id },

      // Food & Beverage
      { name: 'Gordon Ramsay', email: 'gordon@hotel.com', phone: '9876543224', role: 'Head Chef', salary: 7500, department: depts[2]._id },
      { name: 'Bruce Wayne', email: 'bruce@hotel.com', phone: '9876543225', role: 'Bartender', salary: 3000, department: depts[2]._id },

      // Security
      { name: 'Clark Kent', email: 'clark@hotel.com', phone: '9876543226', role: 'Security Guard', salary: 3100, department: depts[3]._id },
      { name: 'Logan Howlett', email: 'logan@hotel.com', phone: '9876543227', role: 'Security Chief', salary: 5000, department: depts[3]._id },

      // Maintenance
      { name: 'Peter Parker', email: 'peter@hotel.com', phone: '9876543228', role: 'Electrician', salary: 3400, department: depts[4]._id },
      { name: 'Tony Stark', email: 'tony@hotel.com', phone: '9876543229', role: 'IT Infrastructure Specialist', salary: 8000, department: depts[4]._id },

      // Sales
      { name: 'Steve Rogers', email: 'steve@hotel.com', phone: '9876543230', role: 'Sales Executive', salary: 4500, department: depts[5]._id },
      { name: 'Selina Kyle', email: 'selina@hotel.com', phone: '9876543231', role: 'Event Coordinator', salary: 4200, department: depts[5]._id },

      // HR
      { name: 'Natasha Romanoff', email: 'natasha@hotel.com', phone: '9876543232', role: 'HR Manager', salary: 6000, department: depts[6]._id },
      { name: 'Wanda Maximoff', email: 'wanda@hotel.com', phone: '9876543233', role: 'Payroll Specialist', salary: 4000, department: depts[6]._id }
    ];

    const staffList = await Staff.create(staffTemplates);
    console.log(`✅ ${staffList.length} Staff members created.`);

    // 6. Seed 12 Booking Entries (3 Booked, 3 CheckedIn, 3 CheckedOut, 3 Cancelled)
    console.log('🌱 Seeding 12 Bookings...');
    
    const getOffsetDate = (daysOffset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + daysOffset);
      d.setHours(12, 0, 0, 0);
      return d;
    };

    // Helper to find a room by roomNumber
    const findRoomId = (num: string) => {
      const r = rooms.find(item => item.roomNumber === num);
      return r ? r._id : rooms[0]._id;
    };

    const findRoomPrice = (num: string) => {
      const r = rooms.find(item => item.roomNumber === num);
      return r ? r.pricePerNight : 100;
    };

    const bookingTemplates = [
      // --- CHECKED IN (Active bookings: Room 101, Room 102, Room 201) ---
      {
        customer: customers[1]._id, // Bob Smith
        room: findRoomId('101'),
        checkInDate: getOffsetDate(-2),
        checkOutDate: getOffsetDate(2),
        totalAmount: 4 * findRoomPrice('101'),
        bookingStatus: BookingStatus.CheckedIn
      },
      {
        customer: customers[3]._id, // Diana Prince
        room: findRoomId('102'),
        checkInDate: getOffsetDate(-1),
        checkOutDate: getOffsetDate(3),
        totalAmount: 4 * findRoomPrice('102'),
        bookingStatus: BookingStatus.CheckedIn
      },
      {
        customer: customers[5]._id, // Fiona Gallagher
        room: findRoomId('201'),
        checkInDate: getOffsetDate(-3),
        checkOutDate: getOffsetDate(1),
        totalAmount: 4 * findRoomPrice('201'),
        bookingStatus: BookingStatus.CheckedIn
      },

      // --- BOOKED (Future bookings: Room 202, Room 301, Room 401) ---
      {
        customer: customers[0]._id, // Alice Johnson
        room: findRoomId('202'),
        checkInDate: getOffsetDate(5),
        checkOutDate: getOffsetDate(8),
        totalAmount: 3 * findRoomPrice('202'),
        bookingStatus: BookingStatus.Booked
      },
      {
        customer: customers[4]._id, // Evan Wright
        room: findRoomId('301'),
        checkInDate: getOffsetDate(10),
        checkOutDate: getOffsetDate(15),
        totalAmount: 5 * findRoomPrice('301'),
        bookingStatus: BookingStatus.Booked
      },
      {
        customer: customers[6]._id, // George Clooney
        room: findRoomId('401'),
        checkInDate: getOffsetDate(12),
        checkOutDate: getOffsetDate(18),
        totalAmount: 6 * findRoomPrice('401'),
        bookingStatus: BookingStatus.Booked
      },

      // --- CHECKED OUT (Past bookings: Room 103, Room 203, Room 302) ---
      {
        customer: customers[2]._id, // Charlie Brown
        room: findRoomId('103'),
        checkInDate: getOffsetDate(-10),
        checkOutDate: getOffsetDate(-7),
        totalAmount: 3 * findRoomPrice('103'),
        bookingStatus: BookingStatus.CheckedOut
      },
      {
        customer: customers[7]._id, // Hannah Abbott
        room: findRoomId('203'),
        checkInDate: getOffsetDate(-8),
        checkOutDate: getOffsetDate(-4),
        totalAmount: 4 * findRoomPrice('203'),
        bookingStatus: BookingStatus.CheckedOut
      },
      {
        customer: customers[8]._id, // Ian Malcolm
        room: findRoomId('302'),
        checkInDate: getOffsetDate(-12),
        checkOutDate: getOffsetDate(-10),
        totalAmount: 2 * findRoomPrice('302'),
        bookingStatus: BookingStatus.CheckedOut
      },

      // --- CANCELLED (Room 204, Room 303, Room 402) ---
      {
        customer: customers[9]._id, // Julia Roberts
        room: findRoomId('204'),
        checkInDate: getOffsetDate(-5),
        checkOutDate: getOffsetDate(-2),
        totalAmount: 3 * findRoomPrice('204'),
        bookingStatus: BookingStatus.Cancelled
      },
      {
        customer: customers[10]._id, // Kevin Bacon
        room: findRoomId('303'),
        checkInDate: getOffsetDate(1),
        checkOutDate: getOffsetDate(4),
        totalAmount: 3 * findRoomPrice('303'),
        bookingStatus: BookingStatus.Cancelled
      },
      {
        customer: customers[11]._id, // Laura Croft
        room: findRoomId('402'),
        checkInDate: getOffsetDate(-20),
        checkOutDate: getOffsetDate(-15),
        totalAmount: 5 * findRoomPrice('402'),
        bookingStatus: BookingStatus.Cancelled
      }
    ];

    const bookings = await Booking.create(bookingTemplates);
    console.log(`✅ ${bookings.length} Bookings created.`);

    console.log('🎉 Database Seeding Completed Successfully with Expanded Data!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
