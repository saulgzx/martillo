import crypto from 'crypto';
import type { RefreshTokenStore } from '../lib/token-store';
import { AuthService } from '../services/auth.service';

class InMemoryTokenStore implements RefreshTokenStore {
  private readonly store = new Map<string, string>();

  async set(tokenKey: string, tokenHash: string): Promise<void> {
    this.store.set(tokenKey, tokenHash);
  }

  async get(tokenKey: string): Promise<string | null> {
    return this.store.get(tokenKey) ?? null;
  }

  async del(tokenKey: string): Promise<void> {
    this.store.delete(tokenKey);
  }
}

describe('AuthService', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  test('hash and compare password', async () => {
    const service = new AuthService(new InMemoryTokenStore(), { privateKey, publicKey });
    const hash = await service.hashPassword('Admin12345!');

    expect(hash).not.toBe('Admin12345!');
    await expect(service.comparePassword('Admin12345!', hash)).resolves.toBe(true);
    await expect(service.comparePassword('WrongPassword1', hash)).resolves.toBe(false);
  });

  test('generate and verify access token', async () => {
    const service = new AuthService(new InMemoryTokenStore(), { privateKey, publicKey });
    const { accessToken, refreshToken } = await service.generateTokens('user-1', 'ADMIN');

    const payload = service.verifyAccessToken(accessToken);
    expect(payload?.sub).toBe('user-1');
    expect(payload?.role).toBe('ADMIN');

    const rotated = await service.refreshTokens(refreshToken);
    expect(rotated).not.toBeNull();
  });

  test('access token expires', async () => {
    const service = new AuthService(new InMemoryTokenStore(), {
      privateKey,
      publicKey,
      accessTokenTtlSeconds: 1,
      refreshTokenTtlSeconds: 30,
    });

    const { accessToken } = await service.generateTokens('user-2', 'USER');
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const payload = service.verifyAccessToken(accessToken);
    expect(payload).toBeNull();
  });
});
