import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

export const notificationRouter = Router();

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((val) => val === 'true'),
});

notificationRouter.get(
  '/admin/notifications',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const parsed = listSchema.parse(req.query);
    const where = {
      userId: req.user!.id,
      ...(parsed.unreadOnly ? { readAt: null } : {}),
    } as const;
    const [total, data] = await prisma.$transaction([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
      }),
    ]);

    const unreadTotal = await prisma.notification.count({
      where: { userId: req.user!.id, readAt: null },
    });

    res.json({ success: true, data: { total, unreadTotal, page: parsed.page, data } });
  }),
);

notificationRouter.post(
  '/admin/notifications/read-all',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  }),
);
