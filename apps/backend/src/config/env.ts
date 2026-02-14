import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_PRIVATE_KEY: z.string().default(''),
  JWT_PUBLIC_KEY: z.string().default(''),
  DATABASE_URL: z.string().default('postgresql://user:password@localhost:5432/martillo'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  // Optional at boot: these features are enabled progressively.
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  RESEND_API_KEY: z.string().optional().default(''),
  FLOW_API_KEY: z.string().optional().default(''),
  FLOW_SECRET_KEY: z.string().optional().default(''),
  ENCRYPTION_KEY: z.string().optional().default(''),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  allowedOrigins: parsedEnv.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export type AppEnv = typeof env;
