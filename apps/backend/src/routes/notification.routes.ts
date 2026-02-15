import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/async-handler';

export const notificationRouter = Router();

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

notificationRouter.get(
  '/admin/notifications',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const parsed = listSchema.parse(req.query);
    const [total, data] = await prisma.$transaction([
      prisma.notification.count({ where: { userId: req.user!.id } }),
      prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { sentAt: 'desc' },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
      }),
    ]);
    res.json({ success: true, data: { total, page: parsed.page, data } });
  }),
);
