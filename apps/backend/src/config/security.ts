import type { Express, Request, RequestHandler, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit';
import { env } from './env';
import { logger } from '../utils/logger';

const isProduction = env.NODE_ENV === 'production';

function devBypass(): RequestHandler {
  return (_req, _res, next) => next();
}

function tooManyRequestsHandler(): NonNullable<Options['handler']> {
  return (_req: Request, res: Response) => {
    res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
  };
}

export const authLoginRateLimiter = isProduction
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => ipKeyGenerator(req.ip ?? '127.0.0.1'),
      handler: tooManyRequestsHandler(),
    })
  : devBypass();

export const authRegisterRateLimiter = isProduction
  ? rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => ipKeyGenerator(req.ip ?? '127.0.0.1'),
      handler: tooManyRequestsHandler(),
    })
  : devBypass();

export const lotMediaRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip ?? '127.0.0.1'),
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

  // Keep global throttling in all envs, but avoid blocking dev iteration by using high ceiling.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: isProduction ? 100 : 10_000,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => ipKeyGenerator(req.ip ?? '127.0.0.1'),
      handler: tooManyRequestsHandler(),
    }),
  );
}
