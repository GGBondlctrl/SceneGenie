import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/tokenService.js';

export interface AuthenticatedRequest extends Request {
  user?: { userId: number; email: string; name: string };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing or invalid token' });
    return;
  }

  const token = header.substring(7).trim();
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    console.error('JWT verification failed:', (err as Error).message);
    res.status(401).json({ error: 'Unauthorized: token expired or invalid' });
  }
}
