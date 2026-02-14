import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './env';

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

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
      origin: env.allowedOrigins,
      credentials: true,
    }),
  );

  app.use(generalRateLimiter);
  app.use('/api/auth', authRateLimiter);
}
