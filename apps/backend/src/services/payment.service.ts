import PDFDocument from 'pdfkit';
import { PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';
import { createPayment, verifyFlowWebhookSignature } from '../integrations/flow.integration';
import { sendAdjudicationWon, sendPaymentConfirmed } from './email.service';

type PaymentOrderResult = {
  paymentId: string;
  flowUrl: string;
  expiresAt: Date;
};

function toNumber(value: Prisma.Decimal | number | string): number {
  return Number(value);
}

export async function createPaymentOrder(adjudicationId: string): Promise<PaymentOrderResult> {
  const adjudication = await prisma.adjudication.findUnique({
    where: { id: adjudicationId },
    include: {
      lot: {
        include: {
          auction: true,
        },
      },
      winningBid: {
        include: {
          bidder: {
            include: {
              user: true,
            },
          },
        },
      },
      payment: true,
    },
  });

  if (!adjudication) {
    throw new AppError(404, 'Adjudication not found');
  }

  const amount = toNumber(adjudication.finalPrice);
  const commissionPct = toNumber(adjudication.lot.auction.commissionPct);
  const commission = amount * (commissionPct / 100);
  const tax = (amount + commission) * 0.19;
  const total = amount + commission + tax;

  const payment =
    adjudication.payment ??
    (await prisma.payment.create({
      data: {
        adjudicationId,
        amount: amount.toFixed(2),
        commission: commission.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        status: PaymentStatus.PENDING,
      },
    }));

  const flow = await createPayment({
    amount: total,
    subject: `Martillo - Pago lote ${adjudication.lot.title}`,
    email: adjudication.winningBid.bidder.user.email,
    urlConfirmation: '/api/payments/flow/webhook',
    urlReturn: '/payments/return',
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerRef: flow.token,
      providerData: {
        flowUrl: flow.url,
        expiresAt: flow.expiresAt.toISOString(),
      },
    },
  });

  await sendAdjudicationWon({
    to: adjudication.winningBid.bidder.user.email,
    name: adjudication.winningBid.bidder.user.fullName,
    lotName: adjudication.lot.title,
    amount,
    paymentUrl: flow.url,
    deadline: flow.expiresAt.toISOString(),
  });

  return {
    paymentId: payment.id,
    flowUrl: flow.url,
    expiresAt: flow.expiresAt,
  };
}

export async function handleFlowWebhook(payload: unknown, signature: string) {
  if (!verifyFlowWebhookSignature(payload, signature)) {
    throw new AppError(400, 'Invalid webhook signature');
  }

  const parsed = (payload ?? {}) as {
    token?: string;
    status?: 'PAID' | 'FAILED';
    amount?: number;
  };

  if (!parsed.token || !parsed.status) {
    throw new AppError(400, 'Invalid webhook payload');
  }

  const payment = await prisma.payment.findFirst({
    where: { providerRef: parsed.token },
  });
  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  if (typeof parsed.amount === 'number' && Number(payment.total) !== Number(parsed.amount)) {
    throw new AppError(400, 'Webhook amount mismatch');
  }

  const status = parsed.status === 'PAID' ? PaymentStatus.PAID : PaymentStatus.FAILED;
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status, providerData: payload as Prisma.InputJsonValue },
  });

  if (updated.status === PaymentStatus.PAID) {
    const full = await prisma.payment.findUnique({
      where: { id: updated.id },
      include: {
        adjudication: {
          include: {
            lot: true,
            winningBid: {
              include: {
                bidder: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (full) {
      await sendPaymentConfirmed({
        to: full.adjudication.winningBid.bidder.user.email,
        name: full.adjudication.winningBid.bidder.user.fullName,
        lotName: full.adjudication.lot.title,
        total: Number(full.total),
      });
    }
  }

  return updated;
}

export async function retryPayment(paymentId: string, userId: string): Promise<PaymentOrderResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      adjudication: {
        include: {
          winningBid: {
            include: {
              bidder: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  const winnerBidderId = payment.adjudication.winningBid.bidderId;
  const bidder = await prisma.bidder.findUnique({ where: { id: winnerBidderId } });
  if (!bidder || bidder.userId !== userId) {
    throw new AppError(403, 'Forbidden');
  }

  return createPaymentOrder(payment.adjudicationId);
}

export async function getPaymentStatus(paymentId: string, userId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      adjudication: {
        include: {
          lot: true,
          winningBid: {
            include: {
              bidder: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  const isWinner = payment.adjudication.winningBid.bidder.userId === userId;
  if (!isWinner) {
    throw new AppError(403, 'Forbidden');
  }

  return payment;
}

export async function getMyAdjudications(userId: string) {
  return prisma.adjudication.findMany({
    where: {
      winningBid: {
        bidder: {
          userId,
        },
      },
    },
    include: {
      lot: true,
      payment: true,
    },
    orderBy: { adjudicatedAt: 'desc' },
  });
}

export async function generateReceipt(paymentId: string, userId: string): Promise<Buffer> {
  const payment = await getPaymentStatus(paymentId, userId);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks: Uint8Array[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('Comprobante de Pago - Martillo');
    doc.moveDown();
    doc.fontSize(12).text(`Payment ID: ${payment.id}`);
    doc.text(`Estado: ${payment.status}`);
    doc.text(`Lote: ${payment.adjudication.lot.title}`);
    doc.text(`Monto: ${payment.amount}`);
    doc.text(`Comision: ${payment.commission}`);
    doc.text(`IVA: ${payment.tax}`);
    doc.text(`Total: ${payment.total}`);
    doc.text(`Fecha: ${payment.updatedAt.toISOString()}`);
    doc.end();
  });
}
