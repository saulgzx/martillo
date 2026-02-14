import { Router } from 'express';
import { login, logout, me, refresh, register } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authLoginRateLimiter, authRegisterRateLimiter } from '../config/security';

export const authRouter = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesion
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login exitoso con access token y cookie refresh.
 *       401:
 *         description: Credenciales invalidas.
 */
authRouter.post('/register', authRegisterRateLimiter, register);
authRouter.post('/login', authLoginRateLimiter, login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);
