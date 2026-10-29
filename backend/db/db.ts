import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

function getDbConfig() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  if (tursoUrl && (tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('https://') || tursoUrl.startsWith('http://'))) {
    return {
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
    };
  }

  // If running in Vercel or serverless environment where root filesystem is read-only:
  if (process.env.VERCEL) {
    const tmpDbPath = path.join('/tmp', 'meditrack_new.db');
    const localDbPath = path.resolve(process.cwd(), 'meditrack_new.db');

    // Seed /tmp database with existing tables and records on cold start if present
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(localDbPath)) {
      try {
        fs.copyFileSync(localDbPath, tmpDbPath);
      } catch (err) {
        console.warn('[Database] Could not seed /tmp database:', err);
      }
    }

    return {
      url: `file:${tmpDbPath}`
    };
  }

  return {
    url: tursoUrl || 'file:./meditrack_new.db',
    authToken: process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN
  };
}

export const db = createClient(getDbConfig());
