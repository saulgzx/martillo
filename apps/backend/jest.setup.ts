process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.PORT = process.env.PORT ?? '4000';
process.env.JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY ?? 'test-private-key';
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY ?? 'test-public-key';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://user:password@localhost:5432/martillo?schema=public';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000';
