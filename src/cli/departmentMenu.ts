import { select, input, confirm, Separator } from '@inquirer/prompts';
import Department, { IDepartment } from '../models/Department';

/**
 * departmentMenu
 * ─────────────
 * Interactive CLI module for Department Management.
 *
 * Features:
 *   1. View All Departments   — formatted table
 *   2. Add Department         — validated form, saved to MongoDB
 *   3. Delete Department      — guard: block if staff assigned
 *
 * File location: src/cli/departmentMenu.ts
 */

type DepartmentMenuChoice = 'view' | 'add' | 'delete' | 'back';

// ─── Helpers ───────────────────────────────────────────────
const printHeader = (title: string): void => {
  console.log();
  console.log('─'.repeat(54));
  console.log(`  🏢  ${title}`);
  console.log('─'.repeat(54));
  console.log();
};

const pause = async (): Promise<void> => {
  await input({ message: 'Press Enter to continue...' });
};

// ══════════════════════════════════════════════════════════
//  FEATURE 1 — View All Departments
// ══════════════════════════════════════════════════════════
const viewDepartments = async (): Promise<void> => {
  printHeader('All Departments');

  const departments = await Department.find().sort({ name: 1 });

  if (departments.length === 0) {
    console.log('  ⚠️   No departments found in the database.\n');
    await pause();
    return;
  }

  console.log(
    `  ${'#'.padEnd(4)} ${'Name'.padEnd(22)} Description`
  );
  console.log(
    `  ${'─'.repeat(4)} ${'─'.repeat(22)} ${'─'.repeat(40)}`
  );

  departments.forEach((d: IDepartment, i: number) => {
    const desc = d.description.length > 45
      ? d.description.slice(0, 42) + '...'
      : d.description;
    console.log(
      `  ${String(i + 1).padEnd(4)} ${d.name.slice(0, 21).padEnd(22)} ${desc}`
    );
  });

  console.log();
  console.log(`  Total: ${departments.length} department(s)`);
  console.log();

  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 2 — Add Department
// ══════════════════════════════════════════════════════════
const addDepartment = async (): Promise<void> => {
  printHeader('Add New Department');

  const name = await input({
    message: 'Department Name:',
    validate: async (v) => {
      if (!v.trim()) return 'Department name is required.';
      if (v.trim().length > 100) return 'Name cannot exceed 100 characters.';
      const exists = await Department.findOne({
        name: { $regex: new RegExp(`^${v.trim()}$`, 'i') },
      });
      if (exists) return `Department "${v.trim()}" already exists.`;
      return true;
    },
  });

  const description = await input({
    message: 'Description:',
    validate: (v) => {
      if (!v.trim()) return 'Description is required.';
      if (v.trim().length > 500) return 'Description cannot exceed 500 characters.';
      return true;
    },
  });

  // ── Review ───────────────────────────────────────────────
  console.log();
  console.log('  📋  Review Details:');
  console.log(`      Name        : ${name.trim()}`);
  console.log(`      Description : ${description.trim()}`);
  console.log();

  const confirmed = await confirm({
    message: 'Save this department?',
    default: true,
  });

  if (!confirmed) {
    console.log('\n  ℹ️   Department creation cancelled.\n');
    await pause();
    return;
  }

  try {
    const dept = await Department.create({
      name: name.trim(),
      description: description.trim(),
    });
    console.log();
    console.log(`  ✅  Department "${dept.name}" created successfully!`);
    console.log(`      ID: ${dept._id}`);
    console.log();
  } catch (err) {
    if (err instanceof Error) {
      console.log(`\n  ❌  Failed to create department: ${err.message}\n`);
    }
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  FEATURE 3 — Delete Department
// ══════════════════════════════════════════════════════════
const deleteDepartment = async (): Promise<void> => {
  printHeader('Delete Department');

  const departments = await Department.find().sort({ name: 1 });

  if (departments.length === 0) {
    console.log('  ⚠️   No departments found to delete.\n');
    await pause();
    return;
  }

  const choices: (
    | { name: string; value: string }
    | InstanceType<typeof Separator>
  )[] = departments.map((d: IDepartment) => ({
    name: `${d.name}  — ${d.description.slice(0, 35)}`,
    value: (d._id as { toString(): string }).toString(),
  }));

  choices.push(new Separator('─────────────────────'));
  choices.push({ name: '↩  Cancel — go back', value: 'cancel' });

  const selectedId = await select<string>({
    message: 'Select department to delete:',
    choices,
    loop: false,
    pageSize: 10,
  });

  if (selectedId === 'cancel') {
    console.log('\n  ℹ️   Deletion cancelled.\n');
    await pause();
    return;
  }

  const dept = await Department.findById(selectedId);
  if (!dept) {
    console.log('\n  ❌  Department not found.\n');
    await pause();
    return;
  }

  // ── Staff assignment guard ───────────────────────────────
  const Staff = (await import('../models/Staff')).default;
  const assignedStaff = await Staff.countDocuments({ department: selectedId });

  if (assignedStaff > 0) {
    console.log();
    console.log(
      `  ❌  Cannot delete "${dept.name}" — ${assignedStaff} staff member(s) are assigned to it.`
    );
    console.log('      Reassign or delete those staff members first.\n');
    await pause();
    return;
  }

  // ── Double-confirm ───────────────────────────────────────
  console.log();
  console.log('  ⚠️   You are about to permanently delete:');
  console.log(`      Name        : ${dept.name}`);
  console.log(`      Description : ${dept.description}`);
  console.log();

  const confirmed = await confirm({
    message: `Delete "${dept.name}" permanently? This cannot be undone.`,
    default: false,
  });

  if (!confirmed) {
    console.log('\n  ℹ️   Deletion cancelled.\n');
    await pause();
    return;
  }

  try {
    await Department.findByIdAndDelete(selectedId);
    console.log(`\n  ✅  Department "${dept.name}" deleted successfully.\n`);
  } catch (err) {
    if (err instanceof Error) {
      console.log(`\n  ❌  Failed to delete: ${err.message}\n`);
    }
  }

  await pause();
};

// ══════════════════════════════════════════════════════════
//  DEPARTMENT MENU LOOP
// ══════════════════════════════════════════════════════════
export const departmentMenu = async (): Promise<void> => {
  let inMenu = true;

  while (inMenu) {
    console.clear();
    console.log('='.repeat(54));
    console.log('       🏨  HOTEL MANAGEMENT SYSTEM  🏨');
    console.log('='.repeat(54));

    const choice = await select<DepartmentMenuChoice>({
      message: '🏢  Department Management — choose an action:',
      loop: false,
      choices: [
        { name: '📋  View All Departments', value: 'view'   },
        { name: '➕  Add New Department',   value: 'add'    },
        { name: '🗑️   Delete Department',    value: 'delete' },
        new Separator('─────────────────────'),
        { name: '↩   Back to Main Menu',    value: 'back'   },
      ],
    });

    switch (choice) {
      case 'view':   await viewDepartments();  break;
      case 'add':    await addDepartment();    break;
      case 'delete': await deleteDepartment(); break;
      case 'back':   inMenu = false;           break;
    }
  }
};
