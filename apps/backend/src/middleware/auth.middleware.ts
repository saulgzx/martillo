import type { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { AuthService } from '../services/auth.service';
import { RedisTokenStore } from '../lib/redis-token-store';
import { env } from '../config/env';

const authService = new AuthService(new RedisTokenStore());
const tokenStore = new RedisTokenStore();

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    // Dev convenience: allow using the httpOnly refresh cookie as session auth.
    // This avoids "stuck" admin pages after reload when accessToken is in-memory only.
    if (env.NODE_ENV !== 'production') {
      const refreshToken = req.cookies?.refreshToken as string | undefined;
      if (refreshToken) {
        const payload = authService.verifyAccessToken(refreshToken);
        if (payload?.sub && payload?.role && payload?.jti) {
          const key = `refresh:${payload.sub}:${payload.jti}`;
          const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
          void tokenStore
            .get(key)
            .then((stored) => {
              if (!stored || stored !== hash) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
              }

              req.user = {
                id: payload.sub,
                role: payload.role,
              };
              next();
            })
            .catch(() => {
              res.status(401).json({ success: false, message: 'Unauthorized' });
            });
          return;
        }
      }
    }

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
