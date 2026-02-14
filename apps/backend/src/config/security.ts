import type { Express, Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './env';
import { logger } from '../utils/logger';

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRegisterRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
});

export const lotMediaRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id ?? req.ip ?? 'anonymous',
});

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function matchesAllowedOrigin(requestOrigin: string, allowedOrigin: string): boolean {
  const normalizedRequest = normalizeOrigin(requestOrigin);
  const normalizedAllowed = normalizeOrigin(allowedOrigin);

  if (normalizedAllowed === '*') return true;
  if (normalizedRequest === normalizedAllowed) return true;

  // Allow wildcard subdomains such as https://*.vercel.app
  const wildcardMatch = normalizedAllowed.match(/^(https?:\/\/)\*\.(.+)$/i);
  if (!wildcardMatch) return false;

  const [, protocol, hostPattern] = wildcardMatch;
  if (!normalizedRequest.startsWith(protocol)) return false;

  const requestHost = normalizedRequest.slice(protocol.length);
  return requestHost === hostPattern || requestHost.endsWith(`.${hostPattern}`);
}

export function applySecurityMiddleware(app: Express): void {
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", ...env.allowedOrigins],
        },
      },
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const allowed = env.allowedOrigins.some((allowedOrigin) =>
          matchesAllowedOrigin(origin, allowedOrigin),
        );

        if (allowed) {
          callback(null, true);
          return;
        }

        logger.warn('Blocked CORS origin', { origin, allowedOrigins: env.allowedOrigins });
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );

  app.use(generalRateLimiter);
}
