import { Router } from 'express';
import { login, logout, me, refresh, register } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLoginRateLimiter, authRegisterRateLimiter } from '../config/security';

export const authRouter = Router();

authRouter.post('/register', authRegisterRateLimiter, register);
authRouter.post('/login', authLoginRateLimiter, login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);
