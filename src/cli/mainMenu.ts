import { select, Separator } from '@inquirer/prompts';

/**
 * mainMenu
 * ─────────
 * Top-level navigation loop for the Hotel Management CLI.
 * Uses the modern @inquirer/prompts standalone API (Inquirer v9+).
 * `select` replaces the old `type: 'list'` prompt.
 *
 * File location: src/cli/mainMenu.ts
 */

import { customerMenu } from './customerMenu';

type MainMenuChoice =
  | 'departments'
  | 'customers'
  | 'staff'
  | 'rooms'
  | 'bookings'
  | 'reports'
  | 'exit';

const printBanner = (): void => {
  console.clear();
  console.log('='.repeat(50));
  console.log('       🏨  HOTEL MANAGEMENT SYSTEM  🏨');
  console.log('          Command Line Interface v1.0');
  console.log('='.repeat(50));
  console.log();
};

const pause = async (): Promise<void> => {
  const { input } = await import('@inquirer/prompts');
  await input({ message: 'Press Enter to return to the main menu...' });
};

export const mainMenu = async (): Promise<void> => {
  let running = true;

  while (running) {
    printBanner();

    const choice = await select<MainMenuChoice>({
      message: '📋  What would you like to manage?',
      choices: [
        { name: '🏢  Departments', value: 'departments' },
        { name: '👤  Customers',   value: 'customers'   },
        { name: '👔  Staff',       value: 'staff'       },
        { name: '🛏️   Rooms',       value: 'rooms'       },
        { name: '📅  Bookings',    value: 'bookings'    },
        { name: '📊  Reports',     value: 'reports'     },
        new Separator('─────────────────────'),
        { name: '🚪  Exit',        value: 'exit'        },
      ],
    });

    switch (choice) {
      case 'departments':
        console.log('\n🏢  Department management — coming soon\n');
        await pause();
        break;

      case 'customers':
        await customerMenu();
        break;

      case 'staff':
        console.log('\n👔  Staff management — coming soon\n');
        await pause();
        break;

      case 'rooms':
        console.log('\n🛏️   Room management — coming soon\n');
        await pause();
        break;

      case 'bookings':
        console.log('\n📅  Booking management — coming soon\n');
        await pause();
        break;

      case 'reports':
        console.log('\n📊  Reports & Analytics — coming soon\n');
        await pause();
        break;

      case 'exit':
        console.log('\n👋  Goodbye! Have a great day.\n');
        running = false;
        break;
    }
  }
};
