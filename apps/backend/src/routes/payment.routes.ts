import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { authenticate } from '../middleware/auth.middleware';
import {
  generateReceipt,
  getMyAdjudications,
  getPaymentStatus,
  handleFlowWebhook,
  retryPayment,
} from '../services/payment.service';

export const paymentRouter = Router();

/**
 * @openapi
 * /api/payments/flow/webhook:
 *   post:
 *     summary: Webhook de confirmacion de pago Flow
 *     tags: [Payments]
 *     description: Endpoint sin JWT que valida firma `x-flow-signature`.
 *     responses:
 *       200:
 *         description: Webhook procesado.
 *       400:
 *         description: Firma invalida o payload incorrecto.
 */
paymentRouter.post(
  '/payments/flow/webhook',
  asyncHandler(async (req, res) => {
    const signature = String(
      req.headers['x-flow-signature'] ?? req.headers['flow-signature'] ?? '',
    );
    const data = await handleFlowWebhook(req.body, signature);
    res.json({ success: true, data });
  }),
);

paymentRouter.get(
  '/payments/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await getPaymentStatus(String(req.params.id), req.user!.id);
    res.json({ success: true, data });
  }),
);

paymentRouter.post(
  '/payments/:id/retry',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await retryPayment(String(req.params.id), req.user!.id);
    res.json({ success: true, data });
  }),
);

paymentRouter.get(
  '/payments/:id/receipt',
  authenticate,
  asyncHandler(async (req, res) => {
    const receipt = await generateReceipt(String(req.params.id), req.user!.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${req.params.id}.pdf`);
    res.status(200).send(receipt);
  }),
);

paymentRouter.get(
  '/adjudications/my',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = await getMyAdjudications(req.user!.id);
    res.json({ success: true, data });
  }),
);
