import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { fail } from '../utils/response.js';

export interface AuthPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

const SECRET = process.env.JWT_SECRET ?? 'hepai-dev-secret';

export function signToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, SECRET, { expiresIn: '7d' });
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return fail(res, '未登录', 401, 40100);
  }
  try {
    const payload = jwt.verify(header.slice(7), SECRET) as AuthPayload;
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
