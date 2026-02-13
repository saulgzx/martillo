import { Router } from 'express';
import type { ApiResponse } from '@martillo/shared';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const response: ApiResponse<{ status: string; timestamp: string }> = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  };
  res.json(response);
});
