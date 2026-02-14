import Redis from 'ioredis';
import { env } from '../config/env';
import type { RefreshTokenStore } from './token-store';
import { logger } from '../utils/logger';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

const memoryFallback = new Map<string, string>();

redis.on('error', (error) => {
  logger.warn('Redis token store unavailable, using in-memory fallback', { error });
});

export class RedisTokenStore implements RefreshTokenStore {
  async set(tokenKey: string, tokenHash: string, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(tokenKey, tokenHash, 'EX', ttlSeconds);
    } catch {
      memoryFallback.set(tokenKey, tokenHash);
      setTimeout(() => memoryFallback.delete(tokenKey), ttlSeconds * 1000).unref();
    }
  }

  async get(tokenKey: string): Promise<string | null> {
    try {
      const value = await redis.get(tokenKey);
      return value ?? memoryFallback.get(tokenKey) ?? null;
    } catch {
      return memoryFallback.get(tokenKey) ?? null;
    }
  }

  async del(tokenKey: string): Promise<void> {
    try {
      await redis.del(tokenKey);
    } catch {
      // Ignore redis errors and clear memory fallback.
    } finally {
      memoryFallback.delete(tokenKey);
    }
  }
}
