import { select, input, Separator } from '@inquirer/prompts';
import { customerMenu }   from './customerMenu';
import { roomMenu }       from './roomMenu';
import { staffMenu }      from './staffMenu';
import { bookingMenu }    from './bookingMenu';
import { departmentMenu } from './departmentMenu';
import { reportMenu }     from './reportMenu';

/**
 * mainMenu
 * ─────────
 * Top-level navigation loop for the Hotel Management CLI.
 * Uses the modern @inquirer/prompts standalone API (Inquirer v9+).
 *
 * File location: src/cli/mainMenu.ts
 */

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

export const mainMenu = async (): Promise<void> => {
  let running = true;

  while (running) {
    printBanner();

    const choice = await select<MainMenuChoice>({
      message: '📋  What would you like to manage?',
      loop: false,
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
        await departmentMenu();  // ✅ Fully implemented
        break;

      case 'customers':
        await customerMenu();    // ✅ Phase 6.2
        break;

      case 'staff':
        await staffMenu();       // ✅ Phase 6.3
        break;

      case 'rooms':
        await roomMenu();        // ✅ Phase 6.3
        break;

      case 'bookings':
        await bookingMenu();     // ✅ Phase 6.4
        break;

      case 'reports':
        await reportMenu();      // ✅ Fully implemented
        break;

      case 'exit':
        console.log('\n👋  Goodbye! Have a great day.\n');
        running = false;
        break;
    }
  }
};
