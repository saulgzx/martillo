import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_PRIVATE_KEY: z.string().min(1, 'JWT_PRIVATE_KEY is required'),
  JWT_PUBLIC_KEY: z.string().min(1, 'JWT_PUBLIC_KEY is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS is required'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = {
  ...parsedEnv.data,
  allowedOrigins: parsedEnv.data.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export type AppEnv = typeof env;
