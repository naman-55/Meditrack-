import type { Request, Response } from 'express';
import app, { initDb } from '../server.js';

let isDbInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureDbInitialized(): Promise<void> {
  if (isDbInitialized) return;
  if (!initPromise) {
    initPromise = initDb()
      .then(() => {
        isDbInitialized = true;
      })
      .catch((err) => {
        initPromise = null;
        console.error('[Vercel Serverless] Failed to initialize database schema:', err);
        throw err;
      });
  }
  return initPromise;
}

export default async function handler(req: Request, res: Response) {
  try {
    await ensureDbInitialized();

    // Ensure request URL preserves the /api prefix so Express route handlers match
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }

    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel Serverless] Uncaught handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : error?.message
      });
    }
  }
}
