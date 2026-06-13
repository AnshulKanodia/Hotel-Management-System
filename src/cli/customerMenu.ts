import { select, input, confirm, Separator } from '@inquirer/prompts';
import Customer, { ICustomer } from '../models/Customer';

/**
 * customerMenu
 * ─────────────
 * Interactive CLI module for Customer Management.
 * Uses the modern @inquirer/prompts standalone API (Inquirer v9+).
 *
 * File location: src/cli/customerMenu.ts
 */

type CustomerMenuChoice = 'view' | 'add' | 'delete' | 'back';

// ─── Helpers ───────────────────────────────────────────────
const printHeader = (title: string): void => {
  console.log();
  console.log('─'.repeat(50));
  console.log(`  👤  ${title}`);
  console.log('─'.repeat(50));
  console.log();
};

const pause = async (): Promise<void> => {
  await input({ message: 'Press Enter to continue...' });
};

// ══════════════════════════════════════════════════════════
//  FEATURE 1 — View All Customers
// ══════════════════════════════════════════════════════════
const viewCustomers = async (): Promise<void> => {
  printHeader('All Customers');

  const customers = await Customer.find().sort({ name: 1 });

  if (customers.length === 0) {
    console.log('  ⚠️   No customers found in the database.\n');
    await pause();
    return;
  }

  console.log(
    `  ${'#'.padEnd(4)} ${'Name'.padEnd(22)} ${'Email'.padEnd(28)} ${'Phone'.padEnd(16)} ID Proof`
  );
  console.log(
    `  ${'─'.repeat(4)} ${'─'.repeat(22)} ${'─'.repeat(28)} ${'─'.repeat(16)} ${'─'.repeat(20)}`
  );

  customers.forEach((c: ICustomer, i: number) => {
    console.log(
      `  ${String(i + 1).padEnd(4)} ${c.name.slice(0, 21).padEnd(22)} ${c.email
        .slice(0, 27)
        .padEnd(28)} ${c.phone.padEnd(16)} ${c.idProof}`
    );
  });

  console.log();
  console.log(`  Total: ${customers.length} customer(s)`);
  console.log();

  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 2 — Add Customer
// ══════════════════════════════════════════════════════════
const addCustomer = async (): Promise<void> => {
  printHeader('Add New Customer');

  // ── Collect fields one by one with inline validation ────
  const name = await input({
    message: 'Full Name:',
    validate: (v) => {
      if (!v.trim()) return 'Name is required.';
      if (v.trim().length > 100) return 'Name cannot exceed 100 characters.';
      return true;
    },
  });

  const email = await input({
    message: 'Email Address:',
    validate: async (v) => {
      if (!v.trim()) return 'Email is required.';
      if (!/^\S+@\S+\.\S+$/.test(v.trim())) return 'Please enter a valid email address.';
      const exists = await Customer.findOne({ email: v.trim().toLowerCase() });
      if (exists) return `Email "${v.trim()}" is already registered.`;
      return true;
    },
  });

  const phone = await input({
    message: 'Phone Number (10–15 digits):',
    validate: (v) => {
      if (!v.trim()) return 'Phone number is required.';
      if (!/^[0-9]{10,15}$/.test(v.trim()))
        return 'Enter a valid phone number (10–15 digits, numbers only).';
      return true;
    },
  });

  const address = await input({
    message: 'Address:',
    validate: (v) => {
      if (!v.trim()) return 'Address is required.';
      if (v.trim().length > 300) return 'Address cannot exceed 300 characters.';
      return true;
    },
  });

  const idProof = await input({
    message: 'ID Proof (e.g. Aadhar: 1234-5678-9012):',
    validate: (v) => {
      if (!v.trim()) return 'ID Proof is required.';
      if (v.trim().length > 100) return 'ID Proof cannot exceed 100 characters.';
      return true;
    },
  });

  // ── Review summary ───────────────────────────────────────
  console.log();
  console.log('  📋  Review Details:');
  console.log(`      Name    : ${name.trim()}`);
  console.log(`      Email   : ${email.trim().toLowerCase()}`);
  console.log(`      Phone   : ${phone.trim()}`);
  console.log(`      Address : ${address.trim()}`);
  console.log(`      ID Proof: ${idProof.trim()}`);
  console.log();

  const confirmed = await confirm({
    message: 'Save this customer?',
    default: true,
  });

  if (!confirmed) {
    console.log('\n  ℹ️   Customer creation cancelled.\n');
    await pause();
    return;
  }

  // ── Save ─────────────────────────────────────────────────
  try {
    const customer = await Customer.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      idProof: idProof.trim(),
    });
    console.log();
    console.log(`  ✅  Customer "${customer.name}" created successfully!`);
    console.log(`      ID: ${customer._id}`);
    console.log();
  } catch (err) {
    if (err instanceof Error) {
      console.log(`\n  ❌  Failed to create customer: ${err.message}\n`);
    }
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 3 — Delete Customer
// ══════════════════════════════════════════════════════════
const deleteCustomer = async (): Promise<void> => {
  printHeader('Delete Customer');

  const customers = await Customer.find().sort({ name: 1 });

  if (customers.length === 0) {
    console.log('  ⚠️   No customers found to delete.\n');
    await pause();
    return;
  }

  // Build choice list
  const choices: (
    | { name: string; value: string }
    | InstanceType<typeof Separator>
  )[] = customers.map((c: ICustomer) => ({
    name: `${c.name}  <${c.email}>  ${c.phone}`,
    value: (c._id as { toString(): string }).toString(),
  }));

  choices.push(new Separator('─────────────────────'));
  choices.push({ name: '↩  Cancel — go back', value: 'cancel' });

  const selectedId = await select<string>({
    message: 'Select customer to delete:',
    choices,
    pageSize: 10,
  });

  if (selectedId === 'cancel') {
    console.log('\n  ℹ️   Deletion cancelled.\n');
    await pause();
    return;
  }

  const customer = await Customer.findById(selectedId);
  if (!customer) {
    console.log('\n  ❌  Customer not found.\n');
    await pause();
    return;
  }

  // ── Active booking guard ─────────────────────────────────
  const Booking = (await import('../models/Booking')).default;
  const { BookingStatus } = await import('../models/Booking');

  const activeBookings = await Booking.countDocuments({
    customer: selectedId,
    bookingStatus: { $in: [BookingStatus.Booked, BookingStatus.CheckedIn] },
  });

  if (activeBookings > 0) {
    console.log();
    console.log(
      `  ❌  Cannot delete "${customer.name}" — they have ${activeBookings} active booking(s).`
    );
    console.log('      Cancel or check out those bookings first.\n');
    await pause();
    return;
  }

  // ── Double-confirm ───────────────────────────────────────
  console.log();
  console.log('  ⚠️   You are about to permanently delete:');
  console.log(`      Name  : ${customer.name}`);
  console.log(`      Email : ${customer.email}`);
  console.log(`      Phone : ${customer.phone}`);
  console.log();

  const confirmed = await confirm({
    message: `Delete "${customer.name}" permanently? This cannot be undone.`,
    default: false,
  });

  if (!confirmed) {
    console.log('\n  ℹ️   Deletion cancelled.\n');
    await pause();
    return;
  }

  // ── Delete ───────────────────────────────────────────────
  try {
    await Customer.findByIdAndDelete(selectedId);
    console.log(`\n  ✅  Customer "${customer.name}" deleted successfully.\n`);
  } catch (err) {
    if (err instanceof Error) {
      console.log(`\n  ❌  Failed to delete: ${err.message}\n`);
    }
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  CUSTOMER MENU LOOP
// ══════════════════════════════════════════════════════════
export const customerMenu = async (): Promise<void> => {
  let inMenu = true;

  while (inMenu) {
    console.clear();
    console.log('='.repeat(50));
    console.log('       🏨  HOTEL MANAGEMENT SYSTEM  🏨');
    console.log('='.repeat(50));

    const choice = await select<CustomerMenuChoice>({
      message: '👤  Customer Management — choose an action:',
      choices: [
        { name: '📋  View All Customers', value: 'view'   },
        { name: '➕  Add New Customer',   value: 'add'    },
        { name: '🗑️   Delete Customer',    value: 'delete' },
        new Separator('─────────────────────'),
        { name: '↩   Back to Main Menu',  value: 'back'   },
      ],
    });

    switch (choice) {
      case 'view':   await viewCustomers();  break;
      case 'add':    await addCustomer();    break;
      case 'delete': await deleteCustomer(); break;
      case 'back':   inMenu = false;         break;
    }
  }
};
