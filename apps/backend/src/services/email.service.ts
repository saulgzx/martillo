import fs from 'fs';
import path from 'path';
import { Resend } from 'resend';
import { env } from '../config/env';

type TemplateData = Record<string, string | number>;

const resend = new Resend(env.RESEND_API_KEY);
const DEFAULT_FROM = 'Martillo <noreply@martillo.app>';

function templatePath(templateName: string): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'src', 'templates', templateName),
    path.resolve(process.cwd(), 'apps', 'backend', 'src', 'templates', templateName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function renderTemplate(templateName: string, data: TemplateData): string {
  const file = templatePath(templateName);
  if (!file) return `<p>Template not found: ${templateName}</p>`;

  let html = fs.readFileSync(file, 'utf8');
  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{{${key}}}`, String(value));
  }
  return html;
}

async function sendEmail(params: { to: string; subject: string; html: string; from?: string }) {
  if (!env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: params.from ?? DEFAULT_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function sendWelcome(params: { to: string; name: string }) {
  return sendEmail({
    to: params.to,
    subject: 'Bienvenido a Martillo',
    html: renderTemplate('welcome.html', {
      name: params.name,
      cta_url: '/',
    }),
  });
}

export async function sendBidderApproved(params: {
  to: string;
  name: string;
  auctionName: string;
  paddleNumber: number;
}) {
  return sendEmail({
    to: params.to,
    subject: 'Aprobado para remate',
    html: renderTemplate('bidder-approved.html', {
      name: params.name,
      auction_name: params.auctionName,
      paddle_number: params.paddleNumber,
      cta_url: '/auctions',
    }),
  });
}

export async function sendBidderRejected(params: {
  to: string;
  name: string;
  auctionName: string;
  reason: string;
}) {
  return sendEmail({
    to: params.to,
    subject: 'Resultado de verificacion de postor',
    html: renderTemplate('bidder-rejected.html', {
      name: params.name,
      auction_name: params.auctionName,
      reason: params.reason,
    }),
  });
}

export async function sendAdjudicationWon(params: {
  to: string;
  name: string;
  lotName: string;
  amount: number;
  paymentUrl: string;
  deadline: string;
}) {
  return sendEmail({
    to: params.to,
    subject: 'Ganaste un lote en Martillo',
    html: renderTemplate('adjudication-won.html', {
      name: params.name,
      lot_name: params.lotName,
      amount: params.amount,
      payment_url: params.paymentUrl,
      deadline: params.deadline,
    }),
  });
}

export async function sendPaymentConfirmed(params: {
  to: string;
  name: string;
  lotName: string;
  total: number;
}) {
  return sendEmail({
    to: params.to,
    subject: 'Pago confirmado',
    html: renderTemplate('payment-confirmed.html', {
      name: params.name,
      lot_name: params.lotName,
      total: params.total,
    }),
  });
}
