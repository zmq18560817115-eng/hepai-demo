import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/index.js';
import { fail } from '../utils/response.js';

export interface AuthPayload {
  userId: string;
  role: string;
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

const SECRET = process.env.JWT_SECRET ?? 'hepai-dev-secret';

export function signToken(userId: string, role: string, sessionId: string) {
  return jwt.sign({ userId, role, sessionId }, SECRET, { expiresIn: '7d' });
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return fail(res, '未登录', 401, 40100);
  }
  try {
    const payload = jwt.verify(header.slice(7), SECRET) as AuthPayload;
    // Optional session validation when table exists
    try {
      const db = getDb();
      const row = db
        .prepare(
          `SELECT revoked_at, expires_at FROM auth_sessions WHERE id = ? AND user_id = ?`,
        )
        .get(payload.sessionId, payload.userId) as
        | { revoked_at: string | null; expires_at: string }
        | undefined;
      if (!row) {
        return fail(res, '登录已失效，请重新进入', 401, 40102);
      }
      if (row.revoked_at) {
        return fail(res, '登录已退出，请重新进入', 401, 40103);
      }
    } catch {
      // ignore if session table not initialized in legacy DB
    }
    req.auth = payload;
    next();
  } catch {
    return fail(res, 'Token 无效或已过期', 401, 40101);
  }
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return fail(res, '无权限', 403, 40300);
    }
    next();
  };
}
