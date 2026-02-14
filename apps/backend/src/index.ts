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

const app = express();
const server = createServer(app);
const PORT = env.PORT;

// Middleware
applySecurityMiddleware(app);
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/health', healthRouter);
app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/auctions', auctionRouter);
app.use('/api', lotRouter);
app.use('/api', bidderRouter);
app.use('/api', paymentRouter);

app.use(errorHandler);

createSocketServer(server);

server.listen(PORT, () => {
  logger.info(`[Martillo API] Server running on http://localhost:${PORT}`);
});

export default app;
