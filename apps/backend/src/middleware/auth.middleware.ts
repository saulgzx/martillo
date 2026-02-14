import type { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RedisTokenStore } from '../lib/redis-token-store';

const authService = new AuthService(new RedisTokenStore());

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const payload = authService.verifyAccessToken(token);
  if (!payload?.sub || !payload?.role) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  req.user = {
    id: payload.sub,
    role: payload.role,
  };
  next();
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    next();
  };
}
