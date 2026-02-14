export interface RefreshTokenStore {
  set(tokenKey: string, tokenHash: string, ttlSeconds: number): Promise<void>;
  get(tokenKey: string): Promise<string | null>;
  del(tokenKey: string): Promise<void>;
}
