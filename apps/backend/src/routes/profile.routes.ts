import { ProfileChangeStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import {
  approveProfileChangeRequest,
  createProfileChangeRequest,
  getMyProfileChangeRequest,
  listProfileChangeRequests,
  rejectProfileChangeRequest,
} from '../services/profile-change.service';

export const profileRouter = Router();

const createSchema = z
  .object({
    email: z.string().email().optional(),
    fullName: z.string().min(2).optional(),
    phone: z.string().min(6).optional(),
  })
  .refine((val) => Boolean(val.email || val.fullName || val.phone), {
    message: 'At least one field is required',
  });

const listSchema = z.object({
  status: z.nativeEnum(ProfileChangeStatus).default(ProfileChangeStatus.PENDING),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const rejectSchema = z.object({
  reason: z.string().min(3),
});

profileRouter.post(
  '/profile/change-requests',
  authenticate,
  authorize('USER'),
  asyncHandler(async (req, res) => {
    const payload = createSchema.parse(req.body);
    const data = await createProfileChangeRequest(req.user!.id, payload);
    res.status(201).json({ success: true, data });
  }),
);

profileRouter.get(
  '/profile/change-requests/me',
  authenticate,
  authorize('USER'),
  asyncHandler(async (req, res) => {
    const data = await getMyProfileChangeRequest(req.user!.id);
    res.json({ success: true, data });
  }),
);

profileRouter.get(
  '/admin/profile-change-requests',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const parsed = listSchema.parse(req.query);
    const data = await listProfileChangeRequests(parsed.status, parsed.page, parsed.limit);
    res.json({ success: true, data });
  }),
);

profileRouter.post(
  '/admin/profile-change-requests/:id/approve',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const data = await approveProfileChangeRequest(String(req.params.id), req.user!.id);
    res.json({ success: true, data });
  }),
);

profileRouter.post(
  '/admin/profile-change-requests/:id/reject',
  authenticate,
  authorize('ADMIN', 'SUPERADMIN'),
  asyncHandler(async (req, res) => {
    const payload = rejectSchema.parse(req.body);
    const data = await rejectProfileChangeRequest(
      String(req.params.id),
      req.user!.id,
      payload.reason,
    );
    res.json({ success: true, data });
  }),
);
