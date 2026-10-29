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

    // Recover original client path if Vercel headers are present
    const originalPath = (req.headers?.['x-forwarded-uri'] as string) || 
                         (req.headers?.['x-matched-path'] as string) || 
                         req.url || 
                         '/api';

    // If req.url was truncated or normalized to '/', restore full original path
    if (!req.url || req.url === '/' || req.url === '/api' || !req.url.startsWith('/api')) {
      if (originalPath && originalPath.startsWith('/api')) {
        req.url = originalPath;
      } else {
        req.url = '/api' + (req.url?.startsWith('/') ? req.url : '/' + (req.url || ''));
      }
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
