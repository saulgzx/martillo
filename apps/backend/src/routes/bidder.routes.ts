import { BidderStatus, DocumentType } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/async-handler';
import { authorize, authenticate } from '../middleware/auth.middleware';
import {
  applyToBid,
  approveBidder,
  banBidderById,
  getAllBidders,
  getBiddersByAuction,
  getMyBidderStatus,
  rejectBidder,
} from '../services/bidder.service';
import { upload } from '../middleware/upload.middleware';
import { getDocuments, uploadDocument } from '../services/document.service';
import { AppError } from '../utils/app-error';

export const bidderRouter = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const statusFilterSchema = z
  .object({
    status: z.nativeEnum(BidderStatus).optional(),
  })
  .passthrough();

const rejectBanSchema = z.object({
  reason: z.string().min(3),
});

const documentUploadSchema = z.object({
  auctionId: z.string().min(1),
  type: z.nativeEnum(DocumentType),
});

const documentQuerySchema = z.object({
  auctionId: z.string().min(1),
});

bidderRouter.post(
  '/auctions/:id/register',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await applyToBid(req.user!.id, String(req.params.id));
    res.status(201).json({ success: true, data });
  }),
);

bidderRouter.get(
  '/auctions/:id/my-status',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await getMyBidderStatus(req.user!.id, String(req.params.id));
    res.json({ success: true, data });
  }),
);

bidderRouter.get(
  '/bidders',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const pagination = paginationSchema.parse(req.query);
    const filters = statusFilterSchema.parse(req.query);
    const data = await getAllBidders(filters, pagination);
    res.json({ success: true, data });
  }),
);

bidderRouter.get(
  '/auctions/:id/bidders',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const pagination = paginationSchema.parse(req.query);
    const filters = statusFilterSchema.parse(req.query);
    const data = await getBiddersByAuction(String(req.params.id), filters, pagination);
    res.json({ success: true, data });
  }),
);

bidderRouter.post(
  '/bidders/:id/approve',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const data = await approveBidder(String(req.params.id), req.user!.id);
    res.json({ success: true, data });
  }),
);

bidderRouter.post(
  '/bidders/:id/reject',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const payload = rejectBanSchema.parse(req.body);
    const data = await rejectBidder(String(req.params.id), req.user!.id, payload.reason);
    res.json({ success: true, data });
  }),
);

bidderRouter.post(
  '/bidders/:id/ban',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const payload = rejectBanSchema.parse(req.body);
    const data = await banBidderById(String(req.params.id), payload.reason, req.user!.id);
    res.json({ success: true, data });
  }),
);

bidderRouter.post(
  '/users/:id/documents',
  authenticate,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (
      req.user!.id !== String(req.params.id) &&
      !['ADMIN', 'SUPERADMIN'].includes(req.user!.role)
    ) {
      throw new AppError(403, 'Forbidden');
    }

    const file = req.file;
    if (!file) {
      throw new AppError(400, 'File is required');
    }

    const payload = documentUploadSchema.parse(req.body);
    const data = await uploadDocument(String(req.params.id), payload.auctionId, file, payload.type);
    res.status(201).json({ success: true, data });
  }),
);

bidderRouter.get(
  '/users/:id/documents',
  authenticate,
  asyncHandler(async (req, res) => {
    const query = documentQuerySchema.parse(req.query);
    const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(req.user!.role);
    const data = await getDocuments(req.user!.id, String(req.params.id), query.auctionId, isAdmin);
    res.json({ success: true, data });
  }),
);
