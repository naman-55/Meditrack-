/**
 * MediTrack Telegram Bot Standalone Polling Runner
 *
 * Runs the Telegram Bot independently via long-polling.
 * Usage:
 *   npx tsx telegram-bot/runner.ts
 *   or: npm run telegram:bot
 */

import dotenv from 'dotenv';
dotenv.config({ quiet: true, override: true });

import path from 'path';
import { db } from '../backend/db/db.js';
import { initNotificationSchema, validateDatabaseSchema } from '../backend/services/notifications/dbSchema.js';
import {
  getBotUsername,
  pollTelegramUpdates,
  getTelegramStatus
} from './telegramService.js';

let isRunning = true;

async function startBot() {
  console.log('====================================================');
  console.log('🤖 MediTrack Telegram Health Assistant Bot Runner');
  console.log('====================================================');

  const resolvedDbPath = path.resolve(process.cwd(), 'meditrack_new.db');
  console.log(`[Database] Connecting to: ${resolvedDbPath}`);

  // 1. Initialize DB schema
  await initNotificationSchema(db);
  const schemaCheck = await validateDatabaseSchema(db);
  if (!schemaCheck.valid) {
    console.warn('[Schema Warning] Some components missing:', schemaCheck.missing);
  } else {
    console.log(`[Schema Verified] Database schema v${schemaCheck.userVersion} is ready.`);
  }

  // 2. Check token configuration
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('\n❌ ERROR: TELEGRAM_BOT_TOKEN is not set in environment or .env file!');
    console.error('Please create a bot via @BotFather on Telegram and add:');
    console.error('TELEGRAM_BOT_TOKEN="your_token_here"\n');
    process.exit(1);
  }

  const botUsername = await getBotUsername();
  console.log(`[Telegram] Bot username: @${botUsername || 'Unknown'}`);
  console.log('[Telegram] Polling service started. Press Ctrl+C to stop.\n');

  // Handle graceful shutdown
  const shutdown = () => {
    if (!isRunning) return;
    console.log('\n[Telegram] Shutting down polling worker gracefully...');
    isRunning = false;
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Main polling loop
  while (isRunning) {
    try {
      const processed = await pollTelegramUpdates(db);
      if (processed > 0) {
        console.log(`[Telegram Update] Processed ${processed} incoming message(s) at ${new Date().toLocaleTimeString()}`);
      }
    } catch (err: any) {
      console.warn('[Telegram Polling Warning]:', err?.message || err);
    }
    // Poll interval (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

startBot().catch(err => {
  console.error('[Telegram Fatal Error]:', err);
  process.exit(1);
});
