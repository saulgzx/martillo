import Redis from 'ioredis';
import { env } from '../config/env';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
});

export class AuctionStateService {
  async setActiveLot(auctionId: string, lotId: string): Promise<void> {
    await redis.set(`auction:${auctionId}:activeLot`, lotId);
  }

  async getActiveLot(auctionId: string): Promise<string | null> {
    return redis.get(`auction:${auctionId}:activeLot`);
  }

  async setAuctionStatus(auctionId: string, status: string): Promise<void> {
    await redis.set(`auction:${auctionId}:status`, status);
  }

  async bidRateLimiter(bidderId: string, lotId: string): Promise<boolean> {
    const key = `bid-rate:${bidderId}:${lotId}`;
    const ok = await redis.set(key, '1', 'EX', 2, 'NX');
    return ok === 'OK';
  }

  async acquireLotLock(lotId: string): Promise<boolean> {
    const lock = await redis.set(`lock:lot:${lotId}`, '1', 'EX', 5, 'NX');
    return lock === 'OK';
  }

  async releaseLotLock(lotId: string): Promise<void> {
    await redis.del(`lock:lot:${lotId}`);
  }
}
