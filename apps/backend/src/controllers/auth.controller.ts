import type { NextFunction, Request, Response } from 'express';
import { Role, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { RedisTokenStore } from '../lib/redis-token-store';
import { AuthService } from '../services/auth.service';
import { env } from '../config/env';
import { decryptPII, encryptPII, maskRut } from '../utils/encryption';
import { sendWelcome } from '../services/email.service';

const authService = new AuthService(new RedisTokenStore());

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must include at least 1 uppercase letter')
    .regex(/[0-9]/, 'Password must include at least 1 number'),
  fullName: z.string().min(2),
  rut: z.string().min(6),
  phone: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type AuthCookieOptions = {
  httpOnly: true;
  sameSite: 'strict' | 'lax' | 'none';
  secure: boolean;
  path: '/';
  maxAge: number;
};

function getRefreshCookieOptions(): AuthCookieOptions {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // In local dev we need cross-port XHR to work reliably (localhost:3000 -> localhost:4000).
    // SameSite=Lax keeps CSRF posture reasonable while allowing dev workflows.
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function toPublicUser(user: {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  rut: string;
  phone: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  let rutMasked = '';
  try {
    rutMasked = maskRut(decryptPII(user.rut));
  } catch {
    // Backward compatibility for non-encrypted legacy values.
    rutMasked = maskRut(user.rut);
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    rutMasked,
    phone: user.phone,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.flatten() });
      return;
    }

    const { email, password, fullName, rut, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already exists' });
      return;
    }

    const passwordHash = await authService.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.USER,
        fullName,
        rut: encryptPII(rut),
        phone,
        status: UserStatus.ACTIVE,
      },
    });

    const tokens = await authService.generateTokens(user.id, user.role);
    res.cookie('refreshToken', tokens.refreshToken, getRefreshCookieOptions());

    await sendWelcome({
      to: user.email,
      name: user.fullName,
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.flatten() });
      return;
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const valid = await authService.comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const tokens = await authService.generateTokens(user.id, user.role);
    res.cookie('refreshToken', tokens.refreshToken, getRefreshCookieOptions());

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken);
    if (!tokens) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    res.cookie('refreshToken', tokens.refreshToken, getRefreshCookieOptions());
    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken as string | undefined;
    if (refreshToken) {
      await authService.revokeRefreshToken(refreshToken);
    }

    res.clearCookie('refreshToken', {
      path: '/',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: env.NODE_ENV === 'production',
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: toPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
}
