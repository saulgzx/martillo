import { Prisma, ProfileChangeStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';

export type ProfileChangeRequestInput = {
  email?: string;
  fullName?: string;
  phone?: string;
};

export async function createProfileChangeRequest(userId: string, input: ProfileChangeRequestInput) {
  const hasAny = Boolean(input.email || input.fullName || input.phone);
  if (!hasAny) {
    throw new AppError(400, 'No changes requested');
  }

  const existingPending = await prisma.profileChangeRequest.findFirst({
    where: { userId, status: ProfileChangeStatus.PENDING },
    select: { id: true },
  });
  if (existingPending) {
    throw new AppError(409, 'There is already a pending profile change request');
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.profileChangeRequest.create({
      data: {
        userId,
        requestedEmail: input.email?.trim() || null,
        requestedFullName: input.fullName?.trim() || null,
        requestedPhone: input.phone?.trim() || null,
        status: ProfileChangeStatus.PENDING,
      },
    });

    // Minimal admin notification (per-user). Tenancy will refine recipients later.
    const admins = await tx.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { id: true },
    });
    if (admins.length > 0) {
      await tx.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'PROFILE_CHANGE_REQUEST_CREATED',
          payload: {
            requestId: created.id,
            requesterUserId: userId,
            requestedEmail: created.requestedEmail,
            requestedFullName: created.requestedFullName,
            requestedPhone: created.requestedPhone,
          } as unknown as Prisma.InputJsonValue,
        })),
      });
    }

    return created;
  });
}

export async function getMyProfileChangeRequest(userId: string) {
  return prisma.profileChangeRequest.findFirst({
    where: { userId, status: ProfileChangeStatus.PENDING },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listProfileChangeRequests(
  status: ProfileChangeStatus,
  page: number,
  limit: number,
) {
  const where: Prisma.ProfileChangeRequestWhereInput = { status };
  const [total, data] = await prisma.$transaction([
    prisma.profileChangeRequest.count({ where }),
    prisma.profileChangeRequest.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return { total, page, data };
}

export async function approveProfileChangeRequest(requestId: string, reviewerId: string) {
  return prisma.$transaction(async (tx) => {
    const req = await tx.profileChangeRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new AppError(404, 'Request not found');
    if (req.status !== ProfileChangeStatus.PENDING) {
      throw new AppError(409, 'Request is not pending');
    }

    // Apply changes to user first (may fail on unique email, etc.).
    try {
      await tx.user.update({
        where: { id: req.userId },
        data: {
          email: req.requestedEmail ?? undefined,
          fullName: req.requestedFullName ?? undefined,
          phone: req.requestedPhone ?? undefined,
        },
      });
    } catch (error) {
      // Common case: email already in use
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(409, 'Email already in use');
      }
      throw error;
    }

    const updated = await tx.profileChangeRequest.update({
      where: { id: requestId },
      data: {
        status: ProfileChangeStatus.APPROVED,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    });

    await tx.auditLog.create({
      data: {
        entity: 'ProfileChangeRequest',
        entityId: requestId,
        action: 'APPROVE',
        actorId: reviewerId,
        newValue: {
          userId: req.userId,
          requestedEmail: req.requestedEmail,
          requestedFullName: req.requestedFullName,
          requestedPhone: req.requestedPhone,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  });
}

export async function rejectProfileChangeRequest(
  requestId: string,
  reviewerId: string,
  reason: string,
) {
  const updated = await prisma.profileChangeRequest.update({
    where: { id: requestId },
    data: {
      status: ProfileChangeStatus.REJECTED,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: 'ProfileChangeRequest',
      entityId: requestId,
      action: 'REJECT',
      actorId: reviewerId,
      newValue: { reason } as unknown as Prisma.InputJsonValue,
    },
  });

  return updated;
}
