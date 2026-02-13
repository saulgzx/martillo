import { Router } from 'express';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

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
