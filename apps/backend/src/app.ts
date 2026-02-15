import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import morgan from 'morgan';
import { applySecurityMiddleware } from './config/security';
import { applySwagger } from './config/swagger';
import { authRouter } from './routes/auth.routes';
import { auctionRouter } from './routes/auction.routes';
import { bidderRouter } from './routes/bidder.routes';
import { healthRouter } from './routes/health';
import { lotRouter } from './routes/lot.routes';
import { paymentRouter } from './routes/payment.routes';
import { profileRouter } from './routes/profile.routes';
import { notificationRouter } from './routes/notification.routes';
import { errorHandler } from './middleware/error.middleware';
import { env } from './config/env';

export function createApp(): Express {
  const app = express();

  applySecurityMiddleware(app);
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/health', healthRouter);
  app.use('/health', healthRouter);

  app.use('/api/auth', authRouter);
  app.use('/api/auctions', auctionRouter);
  app.use('/api', lotRouter);
  app.use('/api', bidderRouter);
  app.use('/api', paymentRouter);
  app.use('/api', profileRouter);
  app.use('/api', notificationRouter);

  if (env.NODE_ENV !== 'production') {
    applySwagger(app);
  }

  app.use(errorHandler);
  return app;
}
