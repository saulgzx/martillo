import crypto from 'crypto';
import { env } from '../config/env';

type CreatePaymentInput = {
  amount: number;
  subject: string;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
};

export type FlowCreatePaymentResponse = {
  token: string;
  url: string;
  expiresAt: Date;
};

function flowBaseUrl() {
  return env.NODE_ENV === 'production' ? 'https://www.flow.cl' : 'https://sandbox.flow.cl';
}

export async function createPayment(
  _input: CreatePaymentInput,
): Promise<FlowCreatePaymentResponse> {
  // Placeholder compatible contract while full API integration is completed.
  const token = crypto.randomUUID();
  const url = `${flowBaseUrl()}/app/web/pay.php?token=${token}`;
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  return {
    token,
    url,
    expiresAt,
  };
}

export function verifyFlowWebhookSignature(payload: unknown, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.FLOW_SECRET_KEY)
    .update(JSON.stringify(payload))
    .digest('hex');

  return signature === expected;
}
