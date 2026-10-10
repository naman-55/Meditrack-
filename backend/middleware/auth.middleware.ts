import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, envConfig } from '../config/env.js';
import { db } from '../db/db.js';

export { JWT_SECRET };

export interface AuthenticatedUser {
  id: number;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  status: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Centralized Authentication Middleware
 * Validates JWT access token and queries current database state for live user status and RBAC.
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;

  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    } else {
      return res.status(401).json({
        error: 'Invalid Authorization header format. Expected "Bearer <token>".',
        code: 'AUTH_INVALID_FORMAT'
      });
    }
  } else if ((req as any).cookies?.accessToken) {
    token = (req as any).cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Authorization header or valid session missing.',
      code: 'AUTH_REQUIRED'
    });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });

    if (!decoded || !decoded.id) {
      return res.status(403).json({
        error: 'Malformed token payload.',
        code: 'AUTH_TOKEN_MALFORMED'
      });
    }

    // Always query database for up-to-date user role & status (Phase 7 & 8)
    const userResult = await db.execute({
      sql: 'SELECT id, email, name, role, status FROM users WHERE id = ?',
      args: [decoded.id]
    });

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Authenticated user account no longer exists.',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }

    const liveUser = userResult.rows[0];

    // Check account status against live database state
    if (liveUser.status === 'SUSPENDED' || liveUser.status === 'DISABLED' || liveUser.status === 'DELETED') {
      return res.status(403).json({
        error: 'Your account has been suspended or deactivated. Access revoked.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    req.user = {
      id: Number(liveUser.id),
      email: String(liveUser.email),
      name: liveUser.name ? String(liveUser.name) : undefined,
      role: (liveUser.role === 'ADMIN' ? 'ADMIN' : 'USER'),
      status: String(liveUser.status)
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Session expired. Please refresh your session or log in again.',
        code: 'AUTH_TOKEN_EXPIRED'
      });
    }
    return res.status(403).json({
      error: 'Invalid or malformed authentication token.',
      code: 'AUTH_TOKEN_INVALID'
    });
  }
};

/**
 * Role-Based Access Control Middleware
 * Requires the authenticated user to hold a specific role
 */
export const requireRole = (requiredRole: 'USER' | 'ADMIN') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        error: `Access denied. Requires ${requiredRole} privileges.`,
        code: 'FORBIDDEN_INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

/**
 * Flexible Role-Based Access Control Middleware
 * Allows access if the authenticated user has any of the specified roles
 */
export const requireRoles = (allowedRoles: Array<'USER' | 'ADMIN'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}.`,
        code: 'FORBIDDEN_INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};
