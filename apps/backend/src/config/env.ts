import dotenv from 'dotenv';
import { generateKeyPairSync, randomBytes } from 'crypto';
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

function ensureDevSecrets<T extends z.infer<typeof envSchema>>(parsed: T): T {
  const isProduction = parsed.NODE_ENV === 'production';

  if (!isProduction && (!parsed.JWT_PRIVATE_KEY || !parsed.JWT_PUBLIC_KEY)) {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    process.env.JWT_PRIVATE_KEY = privateKey;
    process.env.JWT_PUBLIC_KEY = publicKey;

    // These are ephemeral and should be replaced with real env vars if you want persistence across restarts.
    // Do NOT print keys here.
    // eslint-disable-next-line no-console
    console.warn('[martillo] JWT keys missing. Generated ephemeral RSA keys for development.');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return { ...parsed, JWT_PRIVATE_KEY: privateKey, JWT_PUBLIC_KEY: publicKey };
  }

  if (!isProduction && (!parsed.ENCRYPTION_KEY || parsed.ENCRYPTION_KEY.length !== 64)) {
    const encryptionKey = randomBytes(32).toString('hex');
    process.env.ENCRYPTION_KEY = encryptionKey;
    // eslint-disable-next-line no-console
    console.warn(
      '[martillo] ENCRYPTION_KEY missing. Generated an ephemeral dev key (AES-256-GCM).',
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return { ...parsed, ENCRYPTION_KEY: encryptionKey };
  }

  return parsed;
}

const parsedEnv = ensureDevSecrets(envSchema.parse(process.env));

export const env = {
  ...parsedEnv,
  allowedOrigins: parsedEnv.ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export type AppEnv = typeof env;
