'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api';

export type BidUpdate = {
  lotId: string;
  newAmount: string;
  bidderId: number;
  source: 'ONLINE' | 'PRESENCIAL';
  timestamp: string;
};

export type ActiveLot = {
  id: string;
  title: string;
  description: string | null;
  basePrice: string;
  currentPrice: string;
  minIncrement: string;
  category: string | null;
  orderIndex: number;
  media: Array<{ id: string; url: string; type: string }>;
};

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export function useAuctionSocket(auctionId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [paddleNumber, setPaddleNumber] = useState<number | null>(null);
  const [connectedCount, setConnectedCount] = useState(0);
  const [activeLot, setActiveLot] = useState<ActiveLot | null>(null);
  const [bidHistory, setBidHistory] = useState<BidUpdate[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseReason, setPauseReason] = useState<string | null>(null);
  const [isEnded, setIsEnded] = useState(false);
  const [wonLot, setWonLot] = useState<{
    lotId: string;
    lotTitle: string;
    finalPrice: number;
    paymentId: string;
    total: number;
  } | null>(null);

  const accessToken = useAuthStore((s) => s.accessToken);

  // REST fallback: the current codebase mixes a partial socket engine with REST admin actions.
  // Poll the active lot so bidder UI updates even when no socket event is emitted.
  useEffect(() => {
    if (!auctionId) return;

    const hasAuthCookie =
      typeof document !== 'undefined' && document.cookie.includes('martillo_auth=1');

    // If there is no in-memory token yet, we can still try polling; axios will attempt refresh
    // using the cookie flag + refreshToken cookie.
    if (!accessToken && !hasAuthCookie) return;

    let cancelled = false;
    let consecutiveErrors = 0;

    const fetchActiveLot = async () => {
      try {
        const response = await apiClient.get<{
          success: boolean;
          data: Array<{
            id: string;
            title: string;
            description: string | null;
            basePrice: string;
            currentPrice: string;
            minIncrement: string;
            category: string | null;
            orderIndex: number;
            status: string;
            media: Array<{ id: string; url: string; type: string }>;
          }>;
        }>(`/api/auctions/${auctionId}/lots`);

        const next = response.data.data.find((lot) => lot.status === 'ACTIVE') ?? null;
        if (cancelled) return;

        consecutiveErrors = 0;
        setLastError(null);

        setActiveLot((prev) => {
          if (!next) return null;
          if (prev?.id === next.id) {
            // Keep current lot but allow price to be refreshed via polling too.
            if (prev.currentPrice !== next.currentPrice) {
              return { ...prev, currentPrice: next.currentPrice };
            }
            return prev;
          }
          return {
            id: next.id,
            title: next.title,
            description: next.description,
            basePrice: next.basePrice,
            currentPrice: next.currentPrice,
            minIncrement: next.minIncrement,
            category: next.category,
            orderIndex: next.orderIndex,
            media: next.media ?? [],
          };
        });
      } catch (err: unknown) {
        consecutiveErrors += 1;
        if (cancelled) return;

        const status = (err as { response?: { status?: number } })?.response?.status;
        // Don't spam UI; only show after a couple consecutive failures.
        if (consecutiveErrors >= 2) {
          if (status === 401) setLastError('No autorizado. Reintenta iniciar sesión.');
          else if (status === 403) setLastError('Sin permisos para ver la sala.');
          else setLastError('No se pudo sincronizar el lote activo.');
        }
      }
    };

    void fetchActiveLot();
    const timer = setInterval(fetchActiveLot, 1500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [accessToken, auctionId]);

  useEffect(() => {
    if (!accessToken || !auctionId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || '';

    const socket = io(`${socketUrl}/auction`, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;
    setConnectionState('connecting');

    socket.on('connect', () => {
      setConnectionState('connected');
      setLastError(null);
      socket.emit('auction:join', { auctionId });
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socket.io.on('reconnect_attempt', () => {
      setConnectionState('reconnecting');
    });

    socket.io.on('reconnect', () => {
      setConnectionState('connected');
      socket.emit('auction:join', { auctionId });
    });

    socket.on('connect_error', (err) => {
      setLastError(err.message);
      setConnectionState('disconnected');
    });

    // --- Event handlers ---
    socket.on(
      'auction:joined',
      (data: { paddleNumber?: number; connectedCount: number; activeLotId?: string }) => {
        if (data.paddleNumber) setPaddleNumber(data.paddleNumber);
        setConnectedCount(data.connectedCount);
      },
    );

    socket.on('auction:connected-count', (data: { count: number }) => {
      setConnectedCount(data.count);
    });

    socket.on('bid:update', (data: BidUpdate) => {
      setBidHistory((prev) => [data, ...prev].slice(0, 50));
      setActiveLot((prev) => {
        if (!prev || prev.id !== data.lotId) return prev;
        return { ...prev, currentPrice: data.newAmount };
      });
    });

    socket.on('bid:rejected', (data: { reason: string }) => {
      setLastError(data.reason);
      setTimeout(() => setLastError(null), 4000);
    });

    socket.on('lot:active', (data: { lot: ActiveLot; startedAt: string }) => {
      setActiveLot(data.lot);
      setBidHistory([]);
      setIsPaused(false);
    });

    socket.on('lot:adjudicated', (data: { lotId: string }) => {
      if (activeLot?.id === data.lotId || !activeLot) {
        setActiveLot(null);
      }
    });

    socket.on('lot:skipped', () => {
      setActiveLot(null);
    });

    socket.on('lot:won', (data) => {
      setWonLot(data);
    });

    socket.on('auction:paused', (data: { reason: string }) => {
      setIsPaused(true);
      setPauseReason(data.reason);
    });

    socket.on('auction:resumed', () => {
      setIsPaused(false);
      setPauseReason(null);
    });

    socket.on('auction:ended', () => {
      setIsEnded(true);
      setActiveLot(null);
    });

    socket.on('auction:no-more-lots', () => {
      setActiveLot(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, auctionId]);

  const placeBid = useCallback(
    (lotId: string, amount: number) => {
      socketRef.current?.emit('bid:place', { auctionId, lotId, amount });
    },
    [auctionId],
  );

  const auctioneerControls = {
    nextLot: () => socketRef.current?.emit('auction:auctioneer:next-lot', { auctionId }),
    adjudicate: (lotId: string) =>
      socketRef.current?.emit('auction:auctioneer:adjudicate', { auctionId, lotId }),
    skipLot: (lotId: string) =>
      socketRef.current?.emit('auction:auctioneer:skip-lot', { auctionId, lotId }),
    pause: (reason?: string) =>
      socketRef.current?.emit('auction:auctioneer:pause', { auctionId, reason }),
    resume: () => socketRef.current?.emit('auction:auctioneer:resume', { auctionId }),
    end: () => socketRef.current?.emit('auction:auctioneer:end', { auctionId }),
    bidPresencial: (lotId: string, amount: number, paddleNum: number) =>
      socketRef.current?.emit('auction:auctioneer:bid-presencial', {
        auctionId,
        lotId,
        amount,
        paddleNumber: paddleNum,
      }),
  };

  return {
    connectionState,
    paddleNumber,
    connectedCount,
    activeLot,
    bidHistory,
    lastError,
    isPaused,
    pauseReason,
    isEnded,
    wonLot,
    setWonLot,
    placeBid,
    auctioneerControls,
  };
}
