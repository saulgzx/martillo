import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import { healthRouter } from './routes/health';
import { env } from './config/env';
import { applySecurityMiddleware } from './config/security';
import { authRouter } from './routes/auth.routes';
import { auctionRouter } from './routes/auction.routes';
import { lotRouter } from './routes/lot.routes';
import { bidderRouter } from './routes/bidder.routes';
import { paymentRouter } from './routes/payment.routes';
import { errorHandler } from './middleware/error.middleware';
import { createSocketServer } from './socket';
import { logger } from './utils/logger';
import { applySwagger } from './config/swagger';
import { initSentry } from './config/sentry';

const app = express();
const server = createServer(app);
const PORT = Number(process.env.PORT) || env.PORT || 4000;

initSentry();

// Middleware
applySecurityMiddleware(app);
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/health', healthRouter);
app.use('/health', healthRouter);

// Functional routes
app.use('/api/auth', authRouter);
app.use('/api/auctions', auctionRouter);
app.use('/api', lotRouter);
app.use('/api', bidderRouter);
app.use('/api', paymentRouter);

if (env.NODE_ENV !== 'production') {
  applySwagger(app);
}

app.use(errorHandler);

try {
  createSocketServer(server);
} catch (error) {
  logger.error('Socket server initialization failed', { error });
}

server.on('error', (error) => {
  logger.error('HTTP server error', { error });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
});

server.listen(PORT, '0.0.0.0', () => {
  logger.warn(`[Martillo API] Server running on 0.0.0.0:${PORT}`);
});

export default app;
