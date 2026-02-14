import { prisma } from '../lib/prisma';

export async function isBlacklisted(userId: string, auctionId?: string): Promise<boolean> {
  const item = await prisma.blackList.findFirst({
    where: {
      userId,
      OR: [{ auctionId: null }, ...(auctionId ? [{ auctionId }] : [])],
    },
    select: { id: true },
  });

  return Boolean(item);
}

export async function addToBlacklist(
  userId: string,
  reason: string,
  bannedById: string,
  auctionId?: string,
) {
  return prisma.blackList.create({
    data: {
      userId,
      reason,
      bannedById,
      auctionId,
    },
  });
}

export async function removeFromBlacklist(id: string) {
  return prisma.blackList.delete({
    where: { id },
  });
}
