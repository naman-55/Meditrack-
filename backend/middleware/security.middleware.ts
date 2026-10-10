import { Request, Response, NextFunction } from 'express';

/**
 * Attaches standard HTTP security headers to all responses
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // XSS Protection for legacy browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');

  next();
};

/**
 * Centralized API Error Handling Middleware
 * Prevents leakage of stack traces, internal paths, raw database query errors, or keys to clients
 */
export const apiErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] API Error on ${req.method} ${req.originalUrl}:`, err.stack || err.message || err);

  // If response headers are already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : (err.status || 500);

  // Friendly sanitized message
  let clientMessage = 'An unexpected error occurred while processing your request.';
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';

  if (statusCode === 400) {
    clientMessage = err.message || 'The request contained invalid parameters or syntax.';
    errorCode = err.code || 'BAD_REQUEST';
  } else if (statusCode === 401) {
    clientMessage = err.message || 'Authentication required.';
    errorCode = err.code || 'UNAUTHORIZED';
  } else if (statusCode === 403) {
    clientMessage = err.message || 'Access denied.';
    errorCode = err.code || 'FORBIDDEN';
  } else if (statusCode === 404) {
    clientMessage = err.message || 'The requested resource was not found.';
    errorCode = err.code || 'NOT_FOUND';
  } else if (statusCode === 429) {
    clientMessage = err.message || 'Too many requests. Please try again later.';
    errorCode = err.code || 'RATE_LIMIT_EXCEEDED';
  }

  res.status(statusCode).json({
    error: clientMessage,
    code: errorCode,
    timestamp
  });
};
