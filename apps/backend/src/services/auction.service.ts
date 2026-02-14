import { AuctionStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';

type PaginationInput = {
  page: number;
  limit: number;
};

type AuctionFilters = {
  status?: AuctionStatus;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

type CreateAuctionInput = {
  title: string;
  description?: string;
  startAt: Date;
  endAt: Date;
  commissionPct: number;
  terms?: string;
};

export async function createAuction(data: CreateAuctionInput, createdById: string) {
  return prisma.auction.create({
    data: {
      ...data,
      commissionPct: data.commissionPct.toFixed(2),
      createdBy: {
        connect: { id: createdById },
      },
    },
  });
}

export async function getAuctions(filters: AuctionFilters, pagination: PaginationInput) {
  const where: Prisma.AuctionWhereInput = {
    status: filters.status,
    title: filters.search
      ? {
          contains: filters.search,
          mode: 'insensitive',
        }
      : undefined,
    startAt:
      filters.dateFrom || filters.dateTo
        ? {
            gte: filters.dateFrom,
            lte: filters.dateTo,
          }
        : undefined,
  };

  const [total, data] = await prisma.$transaction([
    prisma.auction.count({ where }),
    prisma.auction.findMany({
      where,
      include: { lots: true },
      orderBy: { startAt: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
  ]);

  return {
    data,
    total,
    page: pagination.page,
  };
}

export async function getAuctionById(id: string) {
  const auction = await prisma.auction.findUnique({
    where: { id },
    include: {
      lots: {
        orderBy: { orderIndex: 'asc' },
        include: { media: true },
      },
    },
  });

  if (!auction) {
    throw new AppError(404, 'Auction not found');
  }

  return auction;
}

export async function updateAuction(id: string, data: Prisma.AuctionUpdateInput, userId: string) {
  const auction = await prisma.auction.findUnique({ where: { id } });
  if (!auction) {
    throw new AppError(404, 'Auction not found');
  }

  if (auction.status !== AuctionStatus.DRAFT) {
    throw new AppError(400, 'Only draft auctions can be updated');
  }

  const updated = await prisma.auction.update({
    where: { id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      entity: 'Auction',
      entityId: id,
      action: 'UPDATE',
      actorId: userId,
      newValue: data as unknown as Prisma.InputJsonValue,
    },
  });

  return updated;
}

export async function publishAuction(id: string, userId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id },
    include: { lots: { include: { media: true } } },
  });

  if (!auction) {
    throw new AppError(404, 'Auction not found');
  }

  const hasLotWithMedia = auction.lots.some((lot) => lot.media.length > 0);
  if (!hasLotWithMedia) {
    throw new AppError(400, 'Auction must include at least one lot with media');
  }

  const updated = await prisma.auction.update({
    where: { id },
    data: { status: AuctionStatus.PUBLISHED },
  });

  await prisma.auditLog.create({
    data: {
      entity: 'Auction',
      entityId: id,
      action: 'PUBLISH',
      actorId: userId,
    },
  });

  return updated;
}

export async function cancelAuction(id: string, userId: string) {
  const auction = await prisma.auction.findUnique({ where: { id } });
  if (!auction) {
    throw new AppError(404, 'Auction not found');
  }

  if (auction.status !== AuctionStatus.DRAFT && auction.status !== AuctionStatus.PUBLISHED) {
    throw new AppError(400, 'Only draft or published auctions can be cancelled');
  }

  const updated = await prisma.auction.update({
    where: { id },
    data: { status: AuctionStatus.CANCELLED },
  });

  await prisma.auditLog.create({
    data: {
      entity: 'Auction',
      entityId: id,
      action: 'CANCEL',
      actorId: userId,
    },
  });

  return updated;
}

export async function getPublicAuctions() {
  return prisma.auction.findMany({
    where: {
      status: {
        in: [AuctionStatus.PUBLISHED, AuctionStatus.LIVE],
      },
    },
    include: {
      lots: {
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { startAt: 'asc' },
  });
}
