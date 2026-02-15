import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/async-handler';
import { authorize, authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { lotMediaRateLimiter } from '../config/security';
import { prisma } from '../lib/prisma';
import {
  addMedia,
  activateNextLot,
  createLot,
  deleteLot,
  getLotsByAuction,
  removeMedia,
  reorderLots,
  updateLot,
} from '../services/lot.service';

const router = Router();

const lotCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  basePrice: z.coerce.number().positive(),
  minIncrement: z.coerce.number().positive(),
  category: z.string().optional(),
});

const lotUpdateSchema = lotCreateSchema.partial();

router.get(
  '/auctions/:auctionId/lots',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await getLotsByAuction(String(req.params.auctionId));
    res.json({ success: true, data });
  }),
);

router.post(
  '/auctions/:auctionId/lots',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const payload = lotCreateSchema.parse(req.body);
    const auctionId = String(req.params.auctionId);

    const maxOrder = await prisma.lot.aggregate({
      where: { auctionId },
      _max: { orderIndex: true },
    });
    const nextOrderIndex = (maxOrder._max.orderIndex ?? 0) + 1;

    const data = await createLot({
      ...payload,
      basePrice: payload.basePrice.toFixed(2),
      minIncrement: payload.minIncrement.toFixed(2),
      currentPrice: payload.basePrice.toFixed(2),
      orderIndex: nextOrderIndex,
      auction: { connect: { id: auctionId } },
    });
    res.status(201).json({ success: true, data });
  }),
);

router.put(
  '/auctions/:auctionId/lots/:lotId',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const payload = lotUpdateSchema.parse(req.body);
    const data = await updateLot(String(req.params.lotId), {
      title: payload.title,
      description: payload.description,
      category: payload.category,
      basePrice: payload.basePrice ? payload.basePrice.toFixed(2) : undefined,
      minIncrement: payload.minIncrement ? payload.minIncrement.toFixed(2) : undefined,
    });
    res.json({ success: true, data });
  }),
);

router.delete(
  '/auctions/:auctionId/lots/:lotId',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    await deleteLot(String(req.params.lotId));
    res.status(204).send();
  }),
);

router.post(
  '/auctions/:auctionId/lots/reorder',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const payload = z.object({ orderedIds: z.array(z.string().min(1)).min(1) }).parse(req.body);
    await reorderLots(String(req.params.auctionId), payload.orderedIds);
    res.status(204).send();
  }),
);

// Minimal control endpoint used by the admin live-control UI. This is not the final Socket.io engine.
router.post(
  '/auctions/:auctionId/lots/next',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const data = await activateNextLot(String(req.params.auctionId), req.user!.id);
    res.json({ success: true, data });
  }),
);

router.post(
  '/lots/:lotId/media',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  lotMediaRateLimiter,
  upload.array('files', 10),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const data = await addMedia(String(req.params.lotId), files);
    res.status(201).json({ success: true, data });
  }),
);

router.delete(
  '/lots/:lotId/media/:mediaId',
  authenticate,
  authorize('SUPERADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    await removeMedia(String(req.params.mediaId));
    res.status(204).send();
  }),
);

export { router as lotRouter };
