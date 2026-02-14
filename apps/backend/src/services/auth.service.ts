import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { RefreshTokenStore } from '../lib/token-store';

export type JwtPayload = {
  sub: string;
  role: string;
  jti?: string;
  iat?: number;
  exp?: number;
};

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthServiceOptions = {
  privateKey: string;
  publicKey: string;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
};

export class AuthService {
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly accessTokenTtlSeconds: number;
  private readonly refreshTokenTtlSeconds: number;

  constructor(
    private readonly tokenStore: RefreshTokenStore,
    options?: Partial<AuthServiceOptions>,
  ) {
    this.privateKey = options?.privateKey ?? env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
    this.publicKey = options?.publicKey ?? env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
    this.accessTokenTtlSeconds = options?.accessTokenTtlSeconds ?? 15 * 60;
    this.refreshTokenTtlSeconds = options?.refreshTokenTtlSeconds ?? 7 * 24 * 60 * 60;
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12);
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async generateTokens(userId: string, role: string): Promise<Tokens> {
    const accessToken = jwt.sign({ sub: userId, role }, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.accessTokenTtlSeconds,
    });

    const jti = crypto.randomUUID();
    const refreshToken = jwt.sign({ sub: userId, role, jti }, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: this.refreshTokenTtlSeconds,
    });

    await this.tokenStore.set(
      this.refreshTokenKey(userId, jti),
      this.hashToken(refreshToken),
      this.refreshTokenTtlSeconds,
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.publicKey, { algorithms: ['RS256'] }) as JwtPayload;
    } catch {
      return null;
    }
  }

  async refreshTokens(refreshToken: string): Promise<Tokens | null> {
    try {
      const payload = jwt.verify(refreshToken, this.publicKey, {
        algorithms: ['RS256'],
      }) as JwtPayload;
      if (!payload.sub || !payload.role || !payload.jti) {
        return null;
      }

      const tokenKey = this.refreshTokenKey(payload.sub, payload.jti);
      const storedHash = await this.tokenStore.get(tokenKey);
      if (!storedHash || storedHash !== this.hashToken(refreshToken)) {
        return null;
      }

      await this.tokenStore.del(tokenKey);
      return this.generateTokens(payload.sub, payload.role);
    } catch {
      return null;
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = jwt.verify(refreshToken, this.publicKey, {
        algorithms: ['RS256'],
      }) as JwtPayload;
      if (!payload.sub || !payload.jti) {
        return;
      }
      await this.tokenStore.del(this.refreshTokenKey(payload.sub, payload.jti));
    } catch {
      // Best effort revoke.
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private refreshTokenKey(userId: string, jti: string): string {
    return `refresh:${userId}:${jti}`;
  }
}
