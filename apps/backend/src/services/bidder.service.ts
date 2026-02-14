import { BidderStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';
import { addToBlacklist, isBlacklisted } from './blacklist.service';
import { decryptPII, maskRut } from '../utils/encryption';
import { sendBidderApproved, sendBidderRejected } from './email.service';

type PaginationInput = {
  page: number;
  limit: number;
};

type BidderFilters = {
  status?: BidderStatus;
};

export async function applyToBid(userId: string, auctionId: string) {
  const [auction, existing, blacklisted] = await Promise.all([
    prisma.auction.findUnique({ where: { id: auctionId }, select: { id: true } }),
    prisma.bidder.findUnique({
      where: {
        userId_auctionId: {
          userId,
          auctionId,
        },
      },
    }),
    isBlacklisted(userId, auctionId),
  ]);

  if (!auction) {
    throw new AppError(404, 'Auction not found');
  }

  if (blacklisted) {
    throw new AppError(403, 'User is blacklisted and cannot apply');
  }

  if (existing) {
    throw new AppError(409, 'User has already applied to this auction');
  }

  const maxPaddle = await prisma.bidder.aggregate({
    where: { auctionId },
    _max: { paddleNumber: true },
  });
  const paddleNumber = (maxPaddle._max.paddleNumber ?? 0) + 1;

  return prisma.bidder.create({
    data: {
      userId,
      auctionId,
      paddleNumber,
      status: BidderStatus.PENDING,
    },
  });
}

export async function approveBidder(bidderId: string, adminId: string) {
  const bidder = await prisma.bidder.findUnique({
    where: { id: bidderId },
    include: {
      user: true,
      auction: true,
    },
  });
  if (!bidder) {
    throw new AppError(404, 'Bidder not found');
  }

  const updated = await prisma.bidder.update({
    where: { id: bidderId },
    data: {
      status: BidderStatus.APPROVED,
      verifiedAt: new Date(),
      verifiedById: adminId,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: 'Bidder',
      entityId: bidderId,
      action: 'APPROVE',
      actorId: adminId,
    },
  });

  await sendBidderApproved({
    to: bidder.user.email,
    name: bidder.user.fullName,
    auctionName: bidder.auction.title,
    paddleNumber: bidder.paddleNumber,
  });

  return updated;
}

export async function rejectBidder(bidderId: string, adminId: string, reason: string) {
  const bidder = await prisma.bidder.findUnique({
    where: { id: bidderId },
    include: {
      user: true,
      auction: true,
    },
  });
  if (!bidder) {
    throw new AppError(404, 'Bidder not found');
  }

  const updated = await prisma.bidder.update({
    where: { id: bidderId },
    data: {
      status: BidderStatus.REJECTED,
      verifiedAt: new Date(),
      verifiedById: adminId,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: 'Bidder',
      entityId: bidderId,
      action: 'REJECT',
      actorId: adminId,
      newValue: { reason } as unknown as Prisma.InputJsonValue,
    },
  });

  await sendBidderRejected({
    to: bidder.user.email,
    name: bidder.user.fullName,
    auctionName: bidder.auction.title,
    reason,
  });

  return updated;
}

export async function banBidderById(bidderId: string, reason: string, adminId: string) {
  const bidder = await prisma.bidder.findUnique({ where: { id: bidderId } });
  if (!bidder) {
    throw new AppError(404, 'Bidder not found');
  }

  await addToBlacklist(bidder.userId, reason, adminId, bidder.auctionId);

  const updated = await prisma.bidder.update({
    where: { id: bidderId },
    data: {
      status: BidderStatus.BANNED,
      verifiedAt: new Date(),
      verifiedById: adminId,
    },
  });

  await prisma.auditLog.create({
    data: {
      entity: 'Bidder',
      entityId: bidderId,
      action: 'BAN',
      actorId: adminId,
      newValue: { reason } as unknown as Prisma.InputJsonValue,
    },
  });

  return updated;
}

export async function getBiddersByAuction(
  auctionId: string,
  filters: BidderFilters,
  pagination: PaginationInput,
) {
  const where: Prisma.BidderWhereInput = {
    auctionId,
    status: filters.status,
  };

  const [total, data] = await prisma.$transaction([
    prisma.bidder.count({ where }),
    prisma.bidder.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            rut: true,
            phone: true,
            status: true,
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            uploadedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
  ]);

  const normalized = data.map((item) => {
    let rutMasked = '';
    try {
      rutMasked = maskRut(decryptPII(item.user.rut));
    } catch {
      rutMasked = maskRut(item.user.rut);
    }

    return {
      ...item,
      user: {
        ...item.user,
        rutMasked,
        rut: undefined,
      },
    };
  });

  return { data: normalized, total, page: pagination.page };
}

export async function getAllBidders(filters: BidderFilters, pagination: PaginationInput) {
  const where: Prisma.BidderWhereInput = {
    status: filters.status,
  };

  const [total, data] = await prisma.$transaction([
    prisma.bidder.count({ where }),
    prisma.bidder.findMany({
      where,
      include: {
        auction: { select: { id: true, title: true } },
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            rut: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
  ]);

  const normalized = data.map((item) => {
    let rutMasked = '';
    try {
      rutMasked = maskRut(decryptPII(item.user.rut));
    } catch {
      rutMasked = maskRut(item.user.rut);
    }

    return {
      ...item,
      user: {
        ...item.user,
        rutMasked,
        rut: undefined,
      },
    };
  });

  return { data: normalized, total, page: pagination.page };
}

export async function getMyBidderStatus(userId: string, auctionId: string) {
  return prisma.bidder.findUnique({
    where: {
      userId_auctionId: {
        userId,
        auctionId,
      },
    },
    select: {
      id: true,
      status: true,
      paddleNumber: true,
      verifiedAt: true,
      createdAt: true,
    },
  });
}
