import Redis from 'ioredis';
import { env } from '../config/env';
import type { RefreshTokenStore } from './token-store';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

export class RedisTokenStore implements RefreshTokenStore {
  async set(tokenKey: string, tokenHash: string, ttlSeconds: number): Promise<void> {
    await redis.set(tokenKey, tokenHash, 'EX', ttlSeconds);
  }

  async get(tokenKey: string): Promise<string | null> {
    return redis.get(tokenKey);
  }

  async del(tokenKey: string): Promise<void> {
    await redis.del(tokenKey);
  }
}
