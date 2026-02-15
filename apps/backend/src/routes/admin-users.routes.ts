import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

export const adminUsersRouter = Router();

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).optional(),
});

adminUsersRouter.get(
  '/admin/users',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const parsed = listSchema.parse(req.query);
    const where = {
      role: 'USER' as const,
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.search
        ? {
            OR: [
              { email: { contains: parsed.search, mode: 'insensitive' as const } },
              { fullName: { contains: parsed.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, data] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    res.json({ success: true, data: { total, page: parsed.page, data } });
  }),
);

const setStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']),
  reason: z.string().trim().min(3).optional(),
});

adminUsersRouter.post(
  '/admin/users/:id/status',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const payload = setStatusSchema.parse(req.body);
    const userId = String(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true },
    });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    if (user.role !== 'USER') {
      res.status(400).json({
        success: false,
        message: 'Only USER accounts can be managed here',
      });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: payload.status },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        entity: 'User',
        entityId: userId,
        action: 'SET_STATUS',
        actorId: req.user!.id,
        oldValue: { status: user.status } as unknown as never,
        newValue: { status: payload.status, reason: payload.reason ?? null } as unknown as never,
      },
    });

    res.json({ success: true, data: updated });
  }),
);
