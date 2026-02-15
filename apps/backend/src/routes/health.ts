import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

export const healthRouter = Router();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error('timeout')), ms);
    }),
  ]);
}

healthRouter.get('/', async (req, res) => {
  let db: 'connected' | 'error' = 'connected';
  let redisStatus: 'connected' | 'error' = 'connected';

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 1500);
  } catch {
    db = 'error';
  }

  try {
    if (redis.status !== 'ready') {
      await withTimeout(redis.connect(), 1500);
    }
    await withTimeout(redis.ping(), 1500);
  } catch {
    redisStatus = 'error';
  }

  const status: 'ok' | 'degraded' | 'error' =
    db === 'connected' && redisStatus === 'connected'
      ? 'ok'
      : db === 'error' && redisStatus === 'error'
        ? 'error'
        : 'degraded';

  const payload = {
    status,
    version: process.env.npm_package_version ?? '0.1.0',
    db,
    redis: redisStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  // Keep 200 for degraded/error to avoid false negatives in uptime probes.
  // Content negotiation:
  // - JSON for machines/observability
  // - Text for quick human checks in the browser
  const wantsJson = req.accepts(['json', 'text']) === 'json';
  if (!wantsJson) {
    const text = status === 'ok' ? 'OK' : status.toUpperCase();
    return res.status(200).type('text/plain').send(text);
  }

  return res.status(200).json(payload);
});
