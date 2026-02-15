import { createServer } from 'http';
import { env } from './config/env';
import { createSocketServer } from './socket';
import { logger } from './utils/logger';
import { initSentry } from './config/sentry';
import { createApp } from './app';

const app = createApp();
const server = createServer(app);
const PORT = Number(process.env.PORT) || env.PORT || 4000;

initSentry();

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
