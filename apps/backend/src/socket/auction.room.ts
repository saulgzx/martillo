import type { Namespace, Socket } from 'socket.io';
import { AuctionStatus, BidSource, BidderStatus, LotStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuctionStateService } from '../services/auction-state.service';

type AuthSocket = Socket & {
  data: {
    userId: string;
    role: string;
  };
};

const stateService = new AuctionStateService();

export function registerAuctionEvents(namespace: Namespace) {
  namespace.on('connection', (socket: AuthSocket) => {
    socket.on('auction:join', async ({ auctionId }: { auctionId: string }) => {
      const bidder = await prisma.bidder.findFirst({
        where: {
          auctionId,
          userId: socket.data.userId,
          status: BidderStatus.APPROVED,
        },
      });

      if (!bidder) {
        socket.emit('bid:rejected', { reason: 'Bidder not approved for this auction' });
        return;
      }

      await socket.join(auctionId);
      socket.emit('auction:joined', { auctionId });
    });

    socket.on(
      'bid:place',
      async ({
        auctionId,
        lotId,
        amount,
      }: {
        auctionId: string;
        lotId: string;
        amount: number;
      }) => {
        const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
        if (!auction || auction.status !== AuctionStatus.LIVE) {
          socket.emit('bid:rejected', { reason: 'Auction is not LIVE' });
          return;
        }

        const lot = await prisma.lot.findUnique({ where: { id: lotId } });
        if (!lot || lot.status !== LotStatus.ACTIVE) {
          socket.emit('bid:rejected', { reason: 'Lot is not ACTIVE' });
          return;
        }

        const bidder = await prisma.bidder.findFirst({
          where: {
            auctionId,
            userId: socket.data.userId,
            status: BidderStatus.APPROVED,
          },
        });
        if (!bidder) {
          socket.emit('bid:rejected', { reason: 'Bidder not approved' });
          return;
        }

        const canBidNow = await stateService.bidRateLimiter(bidder.id, lotId);
        if (!canBidNow) {
          socket.emit('bid:rejected', { reason: 'Rate limit exceeded (1 bid every 2 seconds)' });
          return;
        }

        const lockAcquired = await stateService.acquireLotLock(lotId);
        if (!lockAcquired) {
          socket.emit('bid:rejected', { reason: 'Concurrent bid processing' });
          return;
        }

        try {
          const minRequired = Number(lot.currentPrice) + Number(lot.minIncrement);
          if (amount < minRequired) {
            socket.emit('bid:rejected', { reason: `Bid must be >= ${minRequired}` });
            return;
          }

          const result = await prisma.$transaction(async (tx) => {
            const updatedLot = await tx.lot.update({
              where: { id: lotId },
              data: { currentPrice: amount.toFixed(2) },
            });

            const bid = await tx.bid.create({
              data: {
                lotId,
                bidderId: bidder.id,
                amount: amount.toFixed(2),
                source: BidSource.ONLINE,
              },
            });

            await tx.auditLog.create({
              data: {
                entity: 'Bid',
                entityId: bid.id,
                action: 'CREATE',
                actorId: socket.data.userId,
                newValue: { lotId, amount } as unknown as Prisma.InputJsonValue,
              },
            });

            return { updatedLot, bid };
          });

          namespace.to(auctionId).emit('bid:update', {
            lotId,
            newAmount: result.updatedLot.currentPrice,
            bidderId: bidder.paddleNumber,
            timestamp: new Date().toISOString(),
          });
        } finally {
          await stateService.releaseLotLock(lotId);
        }
      },
    );
  });
}
