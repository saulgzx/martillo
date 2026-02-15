import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let db: 'connected' | 'error' = 'connected';
  let redisStatus: 'connected' | 'error' = 'connected';

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'error';
  }

  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }
    await redis.ping();
  } catch {
    redisStatus = 'error';
  }

  const status: 'ok' | 'degraded' | 'error' =
    db === 'connected' && redisStatus === 'connected'
      ? 'ok'
      : db === 'error' && redisStatus === 'error'
        ? 'error'
        : 'degraded';

  // Keep 200 for degraded/error to avoid false negatives in uptime probes.
  res.status(200).json({
    status,
    version: process.env.npm_package_version ?? '0.1.0',
    db,
    redis: redisStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
