import { select, input, confirm, Separator } from '@inquirer/prompts';
import Staff, { IStaff } from '../models/Staff';
import Department, { IDepartment } from '../models/Department';

/**
 * staffMenu
 * ──────────
 * Interactive CLI module for Staff Management.
 *
 * Features:
 *   1. View All Staff         — table with department name populated
 *   2. View Staff by Dept     — filter staff by department
 *   3. Add Staff Member       — validated form; department chosen from live list
 *   4. Delete Staff Member    — double-confirm guard
 *
 * File location: src/cli/staffMenu.ts
 */

type StaffMenuChoice = 'view' | 'viewByDept' | 'add' | 'delete' | 'back';

// ─── Helpers ───────────────────────────────────────────────
const printHeader = (title: string): void => {
  console.log();
  console.log('─'.repeat(60));
  console.log(`  👔  ${title}`);
  console.log('─'.repeat(60));
  console.log();
};

const pause = async (): Promise<void> => {
  await input({ message: 'Press Enter to continue...' });
};

type PopulatedStaff = Omit<IStaff, 'department'> & {
  department: IDepartment | null;
};

/** Prints a formatted staff table */
const printStaffTable = (staffList: PopulatedStaff[]): void => {
  console.log(
    `  ${'#'.padEnd(4)} ${'Name'.padEnd(20)} ${'Role'.padEnd(18)} ${'Department'.padEnd(18)} ${'Phone'.padEnd(14)} Salary`
  );
  console.log(
    `  ${'─'.repeat(4)} ${'─'.repeat(20)} ${'─'.repeat(18)} ${'─'.repeat(18)} ${'─'.repeat(14)} ${'─'.repeat(10)}`
  );
  staffList.forEach((s, i) => {
    const deptName =
      s.department && typeof s.department === 'object' && 'name' in s.department
        ? (s.department as IDepartment).name.slice(0, 17)
        : '—';
    console.log(
      `  ${String(i + 1).padEnd(4)} ${s.name.slice(0, 19).padEnd(20)} ${s.role
        .slice(0, 17)
        .padEnd(18)} ${deptName.padEnd(18)} ${s.phone.padEnd(14)} ₹${s.salary}`
    );
  });
  console.log();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 1 — View All Staff
// ══════════════════════════════════════════════════════════
const viewAllStaff = async (): Promise<void> => {
  printHeader('All Staff Members');

  const staffList = await Staff.find()
    .populate('department', 'name')
    .sort({ name: 1 }) as unknown as PopulatedStaff[];

  if (staffList.length === 0) {
    console.log('  ⚠️   No staff found in the database.\n');
    await pause();
    return;
  }

  printStaffTable(staffList);
  console.log(`  Total: ${staffList.length} staff member(s)`);
  console.log();
  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 2 — View Staff by Department
// ══════════════════════════════════════════════════════════
const viewStaffByDept = async (): Promise<void> => {
  printHeader('View Staff by Department');

  const departments = await Department.find().sort({ name: 1 });

  if (departments.length === 0) {
    console.log('  ⚠️   No departments found. Create a department first.\n');
    await pause();
    return;
  }

  const deptChoices: ({ name: string; value: string } | InstanceType<typeof Separator>)[] =
    departments.map((d) => ({
      name: d.name,
      value: (d._id as { toString(): string }).toString(),
    }));
  deptChoices.push(new Separator('─────────────────────'));
  deptChoices.push({ name: '↩  Cancel', value: 'cancel' });

  const selectedDeptId = await select<string>({
    message: 'Select department:',
    loop: false,
    choices: deptChoices,
  });

  if (selectedDeptId === 'cancel') return;

  const dept = await Department.findById(selectedDeptId);
  const staffList = await Staff.find({ department: selectedDeptId })
    .populate('department', 'name')
    .sort({ name: 1 }) as unknown as PopulatedStaff[];

  console.log();
  if (staffList.length === 0) {
    console.log(`  ⚠️   No staff found in "${dept?.name}".\n`);
    await pause();
    return;
  }

  console.log(`  Department: ${dept?.name}  (${staffList.length} member(s))\n`);
  printStaffTable(staffList);
  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 3 — Add Staff Member
// ══════════════════════════════════════════════════════════
const addStaff = async (): Promise<void> => {
  printHeader('Add New Staff Member');

  // Must have at least one department
  const departments = await Department.find().sort({ name: 1 });
  if (departments.length === 0) {
    console.log('  ⚠️   No departments available. Create a department first.\n');
    await pause();
    return;
  }

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
      const exists = await Staff.findOne({ email: v.trim().toLowerCase() });
      if (exists) return `Email "${v.trim()}" is already registered.`;
      return true;
    },
  });

  const phone = await input({
    message: 'Phone Number (10–15 digits):',
    validate: (v) => {
      if (!v.trim()) return 'Phone number is required.';
      if (!/^[0-9]{10,15}$/.test(v.trim())) return 'Enter a valid phone number (10–15 digits).';
      return true;
    },
  });

  const role = await input({
    message: 'Role (e.g. Receptionist, Manager):',
    validate: (v) => {
      if (!v.trim()) return 'Role is required.';
      if (v.trim().length > 50) return 'Role cannot exceed 50 characters.';
      return true;
    },
  });

  const salaryRaw = await input({
    message: 'Monthly Salary (₹):',
    validate: (v) => {
      const n = Number(v);
      if (isNaN(n) || n < 0) return 'Enter a valid non-negative salary.';
      return true;
    },
  });

  // Department picker — show live list
  const deptChoices = departments.map((d) => ({
    name: `${d.name}  — ${d.description.slice(0, 40)}`,
    value: (d._id as { toString(): string }).toString(),
  }));

  const departmentId = await select<string>({
    message: 'Assign to Department:',
    loop: false,
    choices: deptChoices,
  });

  const dept = departments.find(
    (d) => (d._id as { toString(): string }).toString() === departmentId
  );

  // ── Review ───────────────────────────────────────────────
  console.log();
  console.log('  📋  Review Details:');
  console.log(`      Name       : ${name.trim()}`);
  console.log(`      Email      : ${email.trim().toLowerCase()}`);
  console.log(`      Phone      : ${phone.trim()}`);
  console.log(`      Role       : ${role.trim()}`);
  console.log(`      Salary     : ₹${salaryRaw}`);
  console.log(`      Department : ${dept?.name}`);
  console.log();

  const confirmed = await confirm({ message: 'Save this staff member?', default: true });

  if (!confirmed) {
    console.log('\n  ℹ️   Staff creation cancelled.\n');
    await pause();
    return;
  }

  try {
    const staff = await Staff.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: role.trim(),
      salary: Number(salaryRaw),
      department: departmentId,
    });
    console.log(`\n  ✅  Staff member "${staff.name}" created successfully!`);
    console.log(`      ID: ${staff._id}\n`);
  } catch (err) {
    if (err instanceof Error) console.log(`\n  ❌  Failed to create staff: ${err.message}\n`);
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 4 — Delete Staff Member
// ══════════════════════════════════════════════════════════
const deleteStaff = async (): Promise<void> => {
  printHeader('Delete Staff Member');

  const staffList = await Staff.find()
    .populate('department', 'name')
    .sort({ name: 1 }) as unknown as PopulatedStaff[];

  if (staffList.length === 0) {
    console.log('  ⚠️   No staff found to delete.\n');
    await pause();
    return;
  }

  const choices: ({ name: string; value: string } | InstanceType<typeof Separator>)[] =
    staffList.map((s) => {
      const deptName =
        s.department && typeof s.department === 'object' && 'name' in s.department
          ? (s.department as IDepartment).name
          : '—';
      return {
        name: `${s.name}  (${s.role})  —  ${deptName}`,
        value: (s._id as { toString(): string }).toString(),
      };
    });
  choices.push(new Separator('─────────────────────'));
  choices.push({ name: '↩  Cancel', value: 'cancel' });

  const selectedId = await select<string>({
    message: 'Select staff member to delete:',
    choices,
    loop: false,
    pageSize: 12,
  });

  if (selectedId === 'cancel') return;

  const staff = await Staff.findById(selectedId).populate('department', 'name') as unknown as PopulatedStaff | null;
  if (!staff) {
    console.log('\n  ❌  Staff member not found.\n');
    await pause();
    return;
  }

  const deptName =
    staff.department && typeof staff.department === 'object' && 'name' in staff.department
      ? (staff.department as IDepartment).name
      : '—';

  console.log();
  console.log('  ⚠️   You are about to permanently delete:');
  console.log(`      Name       : ${staff.name}`);
  console.log(`      Role       : ${staff.role}`);
  console.log(`      Email      : ${staff.email}`);
  console.log(`      Department : ${deptName}`);
  console.log();

  const confirmed = await confirm({
    message: `Delete "${staff.name}" permanently? This cannot be undone.`,
    default: false,
  });

  if (!confirmed) {
    console.log('\n  ℹ️   Deletion cancelled.\n');
    await pause();
    return;
  }

  try {
    await Staff.findByIdAndDelete(selectedId);
    console.log(`\n  ✅  Staff member "${staff.name}" deleted successfully.\n`);
  } catch (err) {
    if (err instanceof Error) console.log(`\n  ❌  Failed to delete: ${err.message}\n`);
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  STAFF MENU LOOP
// ══════════════════════════════════════════════════════════
export const staffMenu = async (): Promise<void> => {
  let inMenu = true;

  while (inMenu) {
    console.clear();
    console.log('='.repeat(60));
    console.log('          🏨  HOTEL MANAGEMENT SYSTEM  🏨');
    console.log('='.repeat(60));

    const choice = await select<StaffMenuChoice>({
      message: '👔  Staff Management — choose an action:',
      loop: false,
      choices: [
        { name: '📋  View All Staff',          value: 'view'       },
        { name: '🔍  View Staff by Department', value: 'viewByDept' },
        { name: '➕  Add Staff Member',         value: 'add'        },
        { name: '🗑️   Delete Staff Member',      value: 'delete'     },
        new Separator('─────────────────────'),
        { name: '↩   Back to Main Menu',        value: 'back'       },
      ],
    });

    switch (choice) {
      case 'view':       await viewAllStaff();    break;
      case 'viewByDept': await viewStaffByDept(); break;
      case 'add':        await addStaff();         break;
      case 'delete':     await deleteStaff();      break;
      case 'back':       inMenu = false;           break;
    }
  }
};
