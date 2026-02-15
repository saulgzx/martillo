import { Router } from 'express';
import { AuctionStatus } from '@prisma/client';
import { z } from 'zod';
import { asyncHandler } from '../utils/async-handler';
import { authorize, authenticate } from '../middleware/auth.middleware';
import {
  cancelAuction,
  createAuction,
  getAuctionById,
  getAuctions,
  getPublicAuctions,
  publishAuction,
  updateAuction,
} from '../services/auction.service';

const router = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const auctionCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  commissionPct: z.coerce.number().min(0),
  terms: z.string().optional(),
});

const auctionUpdateSchema = auctionCreateSchema.partial();

/**
 * @openapi
 * /api/auctions/public:
 *   get:
 *     summary: Obtener remates publicos
 *     tags: [Auctions]
 *     responses:
 *       200:
 *         description: Lista de remates publicados/en vivo.
 */
router.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const data = await getPublicAuctions();
    res.json({ success: true, data });
  }),
);

router.get(
  '/',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const pagination = paginationSchema.parse(req.query);
    const filters = {
      status: req.query.status as AuctionStatus | undefined,
      search: req.query.search as string | undefined,
      dateFrom: req.query.dateFrom ? new Date(String(req.query.dateFrom)) : undefined,
      dateTo: req.query.dateTo ? new Date(String(req.query.dateTo)) : undefined,
    };

    const data = await getAuctions(filters, pagination);
    res.json({ success: true, data });
  }),
);

router.post(
  '/',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const payload = auctionCreateSchema.parse(req.body);
    const data = await createAuction(payload, req.user!.id);
    res.status(201).json({ success: true, data });
  }),
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await getAuctionById(String(req.params.id));
    res.json({ success: true, data });
  }),
);

router.put(
  '/:id',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const payload = auctionUpdateSchema.parse(req.body);
    const data = await updateAuction(String(req.params.id), payload, req.user!.id);
    res.json({ success: true, data });
  }),
);

router.post(
  '/:id/publish',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const data = await publishAuction(String(req.params.id), req.user!.id);
    res.json({ success: true, data });
  }),
);

router.delete(
  '/:id',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const data = await cancelAuction(String(req.params.id), req.user!.id);
    res.json({ success: true, data });
  }),
);

export { router as auctionRouter };
