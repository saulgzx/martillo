import type { Namespace, Socket } from 'socket.io';
import { AuctionStatus, BidSource, BidderStatus, LotStatus, Prisma, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuctionStateService } from '../services/auction-state.service';
import { createPaymentOrder } from '../services/payment.service';

type AuthSocket = Socket & {
  data: {
    userId: string;
    role: string;
  };
};

const stateService = new AuctionStateService();

function isAuctionOperator(role: string): boolean {
  return role === Role.ADMIN || role === Role.SUPERADMIN;
}

export function registerAuctionEvents(namespace: Namespace) {
  namespace.on('connection', (socket: AuthSocket) => {
    // --- JOIN ---
    socket.on('auction:join', async ({ auctionId }: { auctionId: string }) => {
      // Admin operators can join without being a bidder
      if (isAuctionOperator(socket.data.role)) {
        await socket.join(auctionId);
        const activeLotId = await stateService.getActiveLot(auctionId);
        const connectedCount = (await namespace.in(auctionId).fetchSockets()).length;
        socket.emit('auction:joined', { auctionId, activeLotId, connectedCount });
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
        socket.emit('bid:rejected', { reason: 'Bidder not approved for this auction' });
        return;
      }

      await socket.join(auctionId);
      const activeLotId = await stateService.getActiveLot(auctionId);
      const connectedCount = (await namespace.in(auctionId).fetchSockets()).length;
      socket.emit('auction:joined', {
        auctionId,
        activeLotId,
        paddleNumber: bidder.paddleNumber,
        connectedCount,
      });
      namespace.to(auctionId).emit('auction:connected-count', { count: connectedCount });
    });

    // --- PLACE BID (online) ---
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

        const rtStatus = await stateService.getAuctionStatus(auctionId);
        if (rtStatus === 'PAUSED') {
          socket.emit('bid:rejected', { reason: 'Auction is PAUSED' });
          return;
        }
        if (rtStatus === 'FINISHED') {
          socket.emit('bid:rejected', { reason: 'Auction is FINISHED' });
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
            source: 'ONLINE',
            timestamp: new Date().toISOString(),
          });
        } finally {
          await stateService.releaseLotLock(lotId);
        }
      },
    );

    // --- ADMIN: REGISTER PRESENCIAL BID ---
    socket.on(
      'auction:auctioneer:bid-presencial',
      async ({
        auctionId,
        lotId,
        amount,
        paddleNumber,
      }: {
        auctionId: string;
        lotId: string;
        amount: number;
        paddleNumber: number;
      }) => {
        if (!isAuctionOperator(socket.data.role)) {
          socket.emit('bid:rejected', { reason: 'Unauthorized: ADMIN role required' });
          return;
        }

        const lot = await prisma.lot.findUnique({ where: { id: lotId } });
        if (!lot || lot.status !== LotStatus.ACTIVE) {
          socket.emit('bid:rejected', { reason: 'Lot is not ACTIVE' });
          return;
        }

        const bidder = await prisma.bidder.findFirst({
          where: { auctionId, paddleNumber, status: BidderStatus.APPROVED },
        });
        if (!bidder) {
          socket.emit('bid:rejected', {
            reason: `Paddle #${paddleNumber} not found or not approved`,
          });
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
                source: BidSource.PRESENCIAL,
              },
            });

            await tx.auditLog.create({
              data: {
                entity: 'Bid',
                entityId: bid.id,
                action: 'CREATE_PRESENCIAL',
                actorId: socket.data.userId,
                newValue: {
                  lotId,
                  amount,
                  paddleNumber,
                } as unknown as Prisma.InputJsonValue,
              },
            });

            return { updatedLot, bid };
          });

          namespace.to(auctionId).emit('bid:update', {
            lotId,
            newAmount: result.updatedLot.currentPrice,
            bidderId: paddleNumber,
            source: 'PRESENCIAL',
            timestamp: new Date().toISOString(),
          });
        } finally {
          await stateService.releaseLotLock(lotId);
        }
      },
    );

    // --- ADMIN: NEXT LOT ---
    socket.on('auction:auctioneer:next-lot', async ({ auctionId }: { auctionId: string }) => {
      if (!isAuctionOperator(socket.data.role)) {
        socket.emit('bid:rejected', { reason: 'Unauthorized' });
        return;
      }

      const rtStatus = await stateService.getAuctionStatus(auctionId);
      if (rtStatus === 'PAUSED') {
        socket.emit('bid:rejected', { reason: 'Auction is PAUSED' });
        return;
      }
      if (rtStatus === 'FINISHED') {
        socket.emit('bid:rejected', { reason: 'Auction is FINISHED' });
        return;
      }

      const auction = await prisma.auction.findUnique({
        where: { id: auctionId },
        include: {
          lots: { orderBy: { orderIndex: 'asc' }, include: { media: true } },
        },
      });
      if (!auction || auction.status !== AuctionStatus.LIVE) {
        socket.emit('bid:rejected', { reason: 'Auction is not LIVE' });
        return;
      }

      // Mark current active lot as UNSOLD if no bids
      const currentActiveLotId = await stateService.getActiveLot(auctionId);
      if (currentActiveLotId) {
        const currentLot = await prisma.lot.findUnique({
          where: { id: currentActiveLotId },
          include: { bids: { take: 1 } },
        });
        if (currentLot && currentLot.status === LotStatus.ACTIVE && currentLot.bids.length === 0) {
          await prisma.lot.update({
            where: { id: currentActiveLotId },
            data: { status: LotStatus.UNSOLD },
          });
        }
      }

      // Find next lot that is PUBLISHED (not yet auctioned)
      const nextLot = auction.lots.find((l) => l.status === LotStatus.PUBLISHED);
      if (!nextLot) {
        socket.emit('auction:no-more-lots', { auctionId });
        return;
      }

      await prisma.lot.update({
        where: { id: nextLot.id },
        data: { status: LotStatus.ACTIVE },
      });
      await stateService.setActiveLot(auctionId, nextLot.id);

      await prisma.auditLog.create({
        data: {
          entity: 'Lot',
          entityId: nextLot.id,
          action: 'ACTIVATE',
          actorId: socket.data.userId,
        },
      });

      namespace.to(auctionId).emit('lot:active', {
        lot: {
          id: nextLot.id,
          title: nextLot.title,
          description: nextLot.description,
          basePrice: nextLot.basePrice,
          currentPrice: nextLot.currentPrice,
          minIncrement: nextLot.minIncrement,
          category: nextLot.category,
          orderIndex: nextLot.orderIndex,
          media: nextLot.media.map((m) => ({ id: m.id, url: m.url, type: m.type })),
        },
        startedAt: new Date().toISOString(),
      });
    });

    // --- ADMIN: ADJUDICATE ---
    socket.on(
      'auction:auctioneer:adjudicate',
      async ({ auctionId, lotId }: { auctionId: string; lotId: string }) => {
        if (!isAuctionOperator(socket.data.role)) {
          socket.emit('bid:rejected', { reason: 'Unauthorized' });
          return;
        }

        const lot = await prisma.lot.findUnique({
          where: { id: lotId },
          include: {
            auction: true,
            bids: { orderBy: { amount: 'desc' }, take: 1, include: { bidder: true } },
          },
        });

        if (!lot || lot.status !== LotStatus.ACTIVE) {
          socket.emit('bid:rejected', { reason: 'Lot is not ACTIVE' });
          return;
        }

        if (lot.bids.length === 0) {
          socket.emit('bid:rejected', { reason: 'No bids on this lot — use skip instead' });
          return;
        }

        const winningBid = lot.bids[0];
        const commissionPct = Number(lot.auction.commissionPct);

        const result = await prisma.$transaction(async (tx) => {
          await tx.lot.update({
            where: { id: lotId },
            data: { status: LotStatus.ADJUDICATED, winnerBidderId: winningBid.bidderId },
          });

          const adjudication = await tx.adjudication.create({
            data: {
              lotId,
              winningBidId: winningBid.id,
              adjudicatedById: socket.data.userId,
              finalPrice: winningBid.amount,
            },
          });

          const amount = Number(winningBid.amount);
          const commission = amount * (commissionPct / 100);
          const tax = (amount + commission) * 0.19;
          const total = amount + commission + tax;

          const payment = await tx.payment.create({
            data: {
              adjudicationId: adjudication.id,
              amount: amount.toFixed(2),
              commission: commission.toFixed(2),
              tax: tax.toFixed(2),
              total: total.toFixed(2),
            },
          });

          await tx.auditLog.create({
            data: {
              entity: 'Adjudication',
              entityId: adjudication.id,
              action: 'CREATE',
              actorId: socket.data.userId,
              newValue: {
                lotId,
                winnerId: winningBid.bidderId,
                finalPrice: Number(winningBid.amount),
              } as unknown as Prisma.InputJsonValue,
            },
          });

          return { adjudication, payment };
        });

        const paymentOrder = await createPaymentOrder(result.adjudication.id);

        await stateService.setActiveLot(auctionId, '');

        namespace.to(auctionId).emit('lot:adjudicated', {
          lotId,
          winner: { paddleNumber: winningBid.bidder.paddleNumber },
          finalPrice: Number(winningBid.amount),
          paymentId: result.payment.id,
          paymentUrl: paymentOrder.flowUrl,
          expiresAt: paymentOrder.expiresAt.toISOString(),
          timestamp: new Date().toISOString(),
        });

        // Notify the winner specifically
        const winnerSockets = await namespace.in(auctionId).fetchSockets();
        for (const s of winnerSockets) {
          if (s.data.userId === winningBid.bidder.userId) {
            s.emit('lot:won', {
              lotId,
              lotTitle: lot.title,
              finalPrice: Number(winningBid.amount),
              paymentId: result.payment.id,
              total: Number(result.payment.total),
              paymentUrl: paymentOrder.flowUrl,
              expiresAt: paymentOrder.expiresAt.toISOString(),
            });
          }
        }
      },
    );

    // --- ADMIN: SKIP LOT (no bids) ---
    socket.on(
      'auction:auctioneer:skip-lot',
      async ({ auctionId, lotId }: { auctionId: string; lotId: string }) => {
        if (!isAuctionOperator(socket.data.role)) {
          socket.emit('bid:rejected', { reason: 'Unauthorized' });
          return;
        }

        await prisma.lot.update({ where: { id: lotId }, data: { status: LotStatus.UNSOLD } });
        await stateService.setActiveLot(auctionId, '');

        await prisma.auditLog.create({
          data: {
            entity: 'Lot',
            entityId: lotId,
            action: 'SKIP_UNSOLD',
            actorId: socket.data.userId,
          },
        });

        namespace.to(auctionId).emit('lot:skipped', {
          lotId,
          timestamp: new Date().toISOString(),
        });
      },
    );

    // --- ADMIN: PAUSE ---
    socket.on(
      'auction:auctioneer:pause',
      async ({ auctionId, reason }: { auctionId: string; reason?: string }) => {
        if (!isAuctionOperator(socket.data.role)) {
          socket.emit('bid:rejected', { reason: 'Unauthorized' });
          return;
        }

        await stateService.setAuctionStatus(auctionId, 'PAUSED');

        await prisma.auditLog.create({
          data: {
            entity: 'Auction',
            entityId: auctionId,
            action: 'PAUSE',
            actorId: socket.data.userId,
            newValue: reason ? ({ reason } as unknown as Prisma.InputJsonValue) : undefined,
          },
        });

        namespace.to(auctionId).emit('auction:paused', {
          reason: reason || 'Subasta en pausa',
          timestamp: new Date().toISOString(),
        });
      },
    );

    // --- ADMIN: RESUME ---
    socket.on('auction:auctioneer:resume', async ({ auctionId }: { auctionId: string }) => {
      if (!isAuctionOperator(socket.data.role)) {
        socket.emit('bid:rejected', { reason: 'Unauthorized' });
        return;
      }

      await stateService.setAuctionStatus(auctionId, 'LIVE');

      await prisma.auditLog.create({
        data: {
          entity: 'Auction',
          entityId: auctionId,
          action: 'RESUME',
          actorId: socket.data.userId,
        },
      });

      namespace.to(auctionId).emit('auction:resumed', {
        timestamp: new Date().toISOString(),
      });
    });

    // --- ADMIN: END AUCTION ---
    socket.on('auction:auctioneer:end', async ({ auctionId }: { auctionId: string }) => {
      if (!isAuctionOperator(socket.data.role)) {
        socket.emit('bid:rejected', { reason: 'Unauthorized' });
        return;
      }

      await prisma.lot.updateMany({
        where: {
          auctionId,
          status: { in: [LotStatus.ACTIVE, LotStatus.PUBLISHED] },
        },
        data: { status: LotStatus.UNSOLD },
      });

      await prisma.auction.update({
        where: { id: auctionId },
        data: { status: AuctionStatus.FINISHED },
      });

      await stateService.setAuctionStatus(auctionId, 'FINISHED');
      await stateService.setActiveLot(auctionId, '');

      await prisma.auditLog.create({
        data: {
          entity: 'Auction',
          entityId: auctionId,
          action: 'END',
          actorId: socket.data.userId,
        },
      });

      namespace.to(auctionId).emit('auction:ended', {
        auctionId,
        timestamp: new Date().toISOString(),
      });
    });

    // --- DISCONNECT ---
    socket.on('disconnecting', async () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          const remaining = (await namespace.in(room).fetchSockets()).length - 1;
          namespace.to(room).emit('auction:connected-count', { count: Math.max(0, remaining) });
        }
      }
    });
  });
}
