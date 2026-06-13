import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../config/db';
import { mainMenu } from './mainMenu';

/**
 * cli.ts
 * ───────
 * Entry point for the CLI runner.
 * Connects to MongoDB Atlas first, then starts the interactive mainMenu loop.
 *
 * Run with:  npm run cli
 *
 * File location: src/cli/cli.ts
 */
const startCLI = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('\n✅  Database connected. Starting CLI...\n');
    await mainMenu();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌  CLI startup failed: ${error.message}\n`);
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

startCLI();
