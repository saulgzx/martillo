import { LotStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';
import { cloudinary } from '../config/cloudinary';
import { assertValidUploadedFile } from '../middleware/upload.middleware';

export async function createLot(data: Prisma.LotCreateInput) {
  return prisma.lot.create({ data });
}

export async function updateLot(id: string, data: Prisma.LotUpdateInput) {
  const lot = await prisma.lot.findUnique({ where: { id } });
  if (!lot) {
    throw new AppError(404, 'Lot not found');
  }

  return prisma.lot.update({
    where: { id },
    data,
  });
}

export async function deleteLot(id: string) {
  const lot = await prisma.lot.findUnique({
    where: { id },
    include: { auction: true },
  });
  if (!lot) {
    throw new AppError(404, 'Lot not found');
  }

  if (lot.auction.status !== 'DRAFT') {
    throw new AppError(400, 'Lot can only be deleted when auction is in DRAFT');
  }

  await prisma.lot.delete({ where: { id } });
}

export async function reorderLots(auctionId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((lotId, index) =>
      prisma.lot.updateMany({
        where: { id: lotId, auctionId },
        data: { orderIndex: index + 1 },
      }),
    ),
  );
}

export async function addMedia(lotId: string, files: Express.Multer.File[]) {
  const lot = await prisma.lot.findUnique({ where: { id: lotId } });
  if (!lot) {
    throw new AppError(404, 'Lot not found');
  }

  const uploaded = [] as Array<{ url: string; cloudinaryId: string; type: string }>;

  for (const file of files) {
    await assertValidUploadedFile(file);
    const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      {
        folder: `martillo/lots/${lotId}`,
        resource_type: resourceType,
      },
    );

    const media = await prisma.lotMedia.create({
      data: {
        lotId,
        type: file.mimetype.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
        url: result.secure_url,
        cloudinaryId: result.public_id,
        orderIndex: 0,
      },
    });

    uploaded.push({
      url: media.url,
      cloudinaryId: media.cloudinaryId ?? '',
      type: media.type,
    });
  }

  return uploaded;
}

export async function removeMedia(mediaId: string) {
  const media = await prisma.lotMedia.findUnique({ where: { id: mediaId } });
  if (!media) {
    throw new AppError(404, 'Media not found');
  }

  if (media.cloudinaryId) {
    await cloudinary.uploader.destroy(media.cloudinaryId, {
      resource_type: media.type === 'DOCUMENT' ? 'raw' : 'image',
    });
  }

  await prisma.lotMedia.delete({ where: { id: mediaId } });
}

export async function getLotsByAuction(auctionId: string) {
  return prisma.lot.findMany({
    where: { auctionId },
    include: { media: true },
    orderBy: { orderIndex: 'asc' },
  });
}

export async function markLotStatus(id: string, status: LotStatus, actorId: string) {
  const lot = await prisma.lot.update({
    where: { id },
    data: { status },
  });

  await prisma.auditLog.create({
    data: {
      entity: 'Lot',
      entityId: id,
      action: `STATUS_${status}`,
      actorId,
    },
  });

  return lot;
}

export async function activateNextLot(auctionId: string, actorId: string) {
  const lots = await prisma.lot.findMany({
    where: { auctionId },
    orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, status: true, orderIndex: true, createdAt: true },
  });

  if (lots.length === 0) {
    throw new AppError(404, 'No lots found for auction');
  }

  const currentIndex = lots.findIndex((lot) => lot.status === LotStatus.ACTIVE);
  const startIndex = currentIndex >= 0 ? currentIndex : -1;

  const remaining = lots.slice(startIndex + 1);
  // Prefer published lots, but allow draft lots to be activated in dev/test.
  const candidate =
    remaining.find((lot) => lot.status === LotStatus.PUBLISHED) ??
    remaining.find((lot) => lot.status === LotStatus.DRAFT) ??
    null;

  if (!candidate) {
    throw new AppError(404, 'No next lot available');
  }

  return prisma.$transaction(async (tx) => {
    // Ensure only 1 active lot per auction.
    await tx.lot.updateMany({
      where: { auctionId, status: LotStatus.ACTIVE },
      data: { status: LotStatus.PUBLISHED },
    });

    const updated = await tx.lot.update({
      where: { id: candidate.id },
      data: { status: LotStatus.ACTIVE },
      include: { media: true },
    });

    await tx.auditLog.create({
      data: {
        entity: 'Auction',
        entityId: auctionId,
        action: 'LOT_ACTIVATE_NEXT',
        actorId,
        newValue: { lotId: updated.id } as unknown as Prisma.InputJsonValue,
      },
    });

    return updated;
  });
}
