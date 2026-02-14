import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { AuthService } from '../services/auth.service';
import { RedisTokenStore } from '../lib/redis-token-store';
import { env } from '../config/env';
import { registerAuctionEvents } from './auction.room';

export function createSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: env.allowedOrigins,
      credentials: true,
    },
  });

  const authService = new AuthService(new RedisTokenStore());
  const auctionNamespace = io.of('/auction');

  auctionNamespace.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Unauthorized'));
      return;
    }

    const payload = authService.verifyAccessToken(token);
    if (!payload?.sub || !payload?.role) {
      next(new Error('Unauthorized'));
      return;
    }

    socket.data.userId = payload.sub;
    socket.data.role = payload.role;
    next();
  });

  registerAuctionEvents(auctionNamespace);
  return io;
}
