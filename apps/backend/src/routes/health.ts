import { Router } from 'express';
import Redis from 'ioredis';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export const healthRouter = Router();
const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
});

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

  const response: ApiResponse<{
    status: 'ok' | 'degraded' | 'error';
    version: string;
    db: 'connected' | 'error';
    redis: 'connected' | 'error';
    uptime: number;
    timestamp: string;
  }> = {
    success: true,
    data: {
      status,
      version: process.env.npm_package_version ?? '0.1.0',
      db,
      redis: redisStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  };

  // Keep 200 for degraded/error to avoid false negatives in uptime probes.
  res.status(200).json(response);
});
