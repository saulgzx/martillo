import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({ success: false, message: error.flatten() });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    res.status(400).json({ success: false, message: 'Database request failed' });
    return;
  }

  res.status(500).json({ success: false, message: 'Internal server error' });
}
