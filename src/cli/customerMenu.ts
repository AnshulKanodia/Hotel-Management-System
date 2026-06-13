import inquirer from 'inquirer';
import Customer, { ICustomer } from '../models/Customer';

/**
 * customerMenu
 * ─────────────
 * Interactive CLI module for Customer Management.
 * Loops until the user selects "Back to Main Menu".
 *
 * Features:
 *   1. View All Customers   — table display of every customer
 *   2. Add Customer         — prompted form, validated, saved to MongoDB
 *   3. Delete Customer      — pick from list, confirm, soft-guard active bookings
 *
 * All DB operations reuse the existing Customer Mongoose model directly.
 * No HTTP calls — the CLI talks to MongoDB the same way the API does.
 *
 * File location: src/cli/customerMenu.ts
 */

// ─── Sub-menu Choice Type ──────────────────────────────────
type CustomerMenuChoice = 'view' | 'add' | 'delete' | 'back';

// ─── Section Header Helper ─────────────────────────────────
const printHeader = (title: string): void => {
  console.log();
  console.log('─'.repeat(50));
  console.log(`  👤  ${title}`);
  console.log('─'.repeat(50));
  console.log();
};

// ─── Pause Helper ──────────────────────────────────────────
const pause = (): Promise<void> =>
  inquirer
    .prompt([
      {
        type: 'input',
        name: '_',
        message: 'Press Enter to continue...',
      },
    ])
    .then(() => undefined);

// ══════════════════════════════════════════════════════════
//  FEATURE 1 — View All Customers
// ══════════════════════════════════════════════════════════
/**
 * viewCustomers
 * Fetches all customers from MongoDB, sorted by name,
 * and prints them as a formatted table in the terminal.
 */
const viewCustomers = async (): Promise<void> => {
  printHeader('All Customers');

  const customers = await Customer.find().sort({ name: 1 });

  if (customers.length === 0) {
    console.log('  ⚠️   No customers found in the database.\n');
    await pause();
    return;
  }

  // Print column headers
  console.log(
    `  ${'#'.padEnd(4)} ${'Name'.padEnd(22)} ${'Email'.padEnd(28)} ${'Phone'.padEnd(16)} ID Proof`
  );
  console.log(
    `  ${'─'.repeat(4)} ${'─'.repeat(22)} ${'─'.repeat(28)} ${'─'.repeat(16)} ${'─'.repeat(20)}`
  );

  // Print each customer row
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
/**
 * addCustomer
 * Collects all required customer fields via Inquirer prompts,
 * validates them inline, and saves a new Customer document.
 *
 * Validation strategy:
 *   - Each prompt has a `validate` function that mirrors the Mongoose
 *     schema rules so the user gets instant feedback instead of a
 *     server-side error after the full form is submitted.
 *   - Duplicate email is checked against the DB before insert.
 */
const addCustomer = async (): Promise<void> => {
  printHeader('Add New Customer');

  const answers = await inquirer.prompt<{
    name: string;
    email: string;
    phone: string;
    address: string;
    idProof: string;
  }>([
    {
      type: 'input',
      name: 'name',
      message: 'Full Name:',
      validate: (v: string) => {
        if (!v.trim()) return 'Name is required.';
        if (v.trim().length > 100) return 'Name cannot exceed 100 characters.';
        return true;
      },
      filter: (v: string) => v.trim(),
    },
    {
      type: 'input',
      name: 'email',
      message: 'Email Address:',
      validate: async (v: string) => {
        if (!v.trim()) return 'Email is required.';
        if (!/^\S+@\S+\.\S+$/.test(v.trim())) return 'Please enter a valid email address.';
        // Live duplicate check against MongoDB
        const exists = await Customer.findOne({ email: v.trim().toLowerCase() });
        if (exists) return `Email "${v.trim()}" is already registered.`;
        return true;
      },
      filter: (v: string) => v.trim().toLowerCase(),
    },
    {
      type: 'input',
      name: 'phone',
      message: 'Phone Number (10–15 digits):',
      validate: (v: string) => {
        if (!v.trim()) return 'Phone number is required.';
        if (!/^[0-9]{10,15}$/.test(v.trim())) return 'Enter a valid phone number (10–15 digits, numbers only).';
        return true;
      },
      filter: (v: string) => v.trim(),
    },
    {
      type: 'input',
      name: 'address',
      message: 'Address:',
      validate: (v: string) => {
        if (!v.trim()) return 'Address is required.';
        if (v.trim().length > 300) return 'Address cannot exceed 300 characters.';
        return true;
      },
      filter: (v: string) => v.trim(),
    },
    {
      type: 'input',
      name: 'idProof',
      message: 'ID Proof (e.g. Aadhar: 1234-5678-9012):',
      validate: (v: string) => {
        if (!v.trim()) return 'ID Proof is required.';
        if (v.trim().length > 100) return 'ID Proof cannot exceed 100 characters.';
        return true;
      },
      filter: (v: string) => v.trim(),
    },
  ]);

  // ── Confirm before saving ────────────────────────────────
  console.log();
  console.log('  📋  Review Details:');
  console.log(`      Name    : ${answers.name}`);
  console.log(`      Email   : ${answers.email}`);
  console.log(`      Phone   : ${answers.phone}`);
  console.log(`      Address : ${answers.address}`);
  console.log(`      ID Proof: ${answers.idProof}`);
  console.log();

  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Save this customer?',
      default: true,
    },
  ]);

  if (!confirmed) {
    console.log('\n  ℹ️   Customer creation cancelled.\n');
    await pause();
    return;
  }

  // ── Save to MongoDB ──────────────────────────────────────
  try {
    const customer = await Customer.create(answers);
    console.log();
    console.log(`  ✅  Customer "${customer.name}" created successfully!`);
    console.log(`      ID: ${customer._id}`);
    console.log();
  } catch (error) {
    if (error instanceof Error) {
      console.log(`\n  ❌  Failed to create customer: ${error.message}\n`);
    }
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 3 — Delete Customer
// ══════════════════════════════════════════════════════════
/**
 * deleteCustomer
 * Presents a searchable list of all customers to pick from.
 * Requires a double confirmation (select + confirm prompt)
 * to prevent accidental deletions.
 *
 * Guard: if the customer has any bookings (Booked or CheckedIn),
 * deletion is blocked with a clear message.
 */
const deleteCustomer = async (): Promise<void> => {
  printHeader('Delete Customer');

  const customers = await Customer.find().sort({ name: 1 });

  if (customers.length === 0) {
    console.log('  ⚠️   No customers found to delete.\n');
    await pause();
    return;
  }

  // Build choice list for the selector
  const choices = customers.map((c: ICustomer) => ({
    name: `${c.name}  <${c.email}>  ${c.phone}`,
    value: c._id.toString(),
  }));

  choices.push(new inquirer.Separator('─────────────────────') as never);
  choices.push({ name: '↩  Cancel — go back', value: 'cancel' });

  const { selectedId } = await inquirer.prompt<{ selectedId: string }>([
    {
      type: 'list',
      name: 'selectedId',
      message: 'Select customer to delete:',
      choices,
      pageSize: 10,
    },
  ]);

  if (selectedId === 'cancel') {
    console.log('\n  ℹ️   Deletion cancelled.\n');
    await pause();
    return;
  }

  // ── Fetch fresh document for confirmation display ────────
  const customer = await Customer.findById(selectedId);
  if (!customer) {
    console.log('\n  ❌  Customer not found (may have been deleted already).\n');
    await pause();
    return;
  }

  // ── Guard: block deletion if active bookings exist ───────
  // Lazy import to avoid circular deps at module load time
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

  // ── Double-confirm before permanent deletion ─────────────
  console.log();
  console.log(`  ⚠️   You are about to permanently delete:`);
  console.log(`      Name  : ${customer.name}`);
  console.log(`      Email : ${customer.email}`);
  console.log(`      Phone : ${customer.phone}`);
  console.log();

  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Delete "${customer.name}" permanently? This cannot be undone.`,
      default: false,       // default to No — safer
    },
  ]);

  if (!confirmed) {
    console.log('\n  ℹ️   Deletion cancelled.\n');
    await pause();
    return;
  }

  // ── Perform deletion ─────────────────────────────────────
  try {
    await Customer.findByIdAndDelete(selectedId);
    console.log(`\n  ✅  Customer "${customer.name}" deleted successfully.\n`);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`\n  ❌  Failed to delete customer: ${error.message}\n`);
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

    const { choice } = await inquirer.prompt<{ choice: CustomerMenuChoice }>([
      {
        type: 'list',
        name: 'choice',
        message: '👤  Customer Management — choose an action:',
        choices: [
          { name: '📋  View All Customers', value: 'view'   },
          { name: '➕  Add New Customer',   value: 'add'    },
          { name: '🗑️   Delete Customer',    value: 'delete' },
          new inquirer.Separator('─────────────────────'),
          { name: '↩   Back to Main Menu',  value: 'back'   },
        ],
      },
    ]);

    switch (choice) {
      case 'view':
        await viewCustomers();
        break;
      case 'add':
        await addCustomer();
        break;
      case 'delete':
        await deleteCustomer();
        break;
      case 'back':
        inMenu = false;
        break;
    }
  }
};
