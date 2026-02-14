import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { captureSentryException } from '../config/sentry';

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    logger.warn('Handled application error', {
      statusCode: error.statusCode,
      message: error.message,
      path: req.path,
      method: req.method,
    });
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }

  if (error instanceof ZodError) {
    logger.warn('Validation error', {
      path: req.path,
      method: req.method,
      issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
    res.status(400).json({ success: false, message: error.flatten() });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn('Prisma known request error', {
      path: req.path,
      method: req.method,
      code: error.code,
    });
    res.status(400).json({ success: false, message: 'Database request failed' });
    return;
  }

  logger.error('Unhandled server error', {
    path: req.path,
    method: req.method,
    error,
  });
  captureSentryException(error);
  res.status(500).json({ success: false, message: 'Internal server error' });
}
