'use client';

import type { BidUpdate } from '@/hooks/useAuctionSocket';

type Props = {
  bids: BidUpdate[];
  myPaddle?: number | null;
};

const formatCLP = (n: string | number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(n));

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export function BidHistory({ bids, myPaddle }: Props) {
  if (bids.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">Sin pujas aún</p>;
  }

  return (
    <div className="space-y-1">
      {bids.map((bid, i) => {
        const isMine = myPaddle !== null && bid.bidderId === myPaddle;
        return (
          <div
            key={`${bid.timestamp}-${i}`}
            className={`flex items-center justify-between rounded px-3 py-1.5 text-sm ${
              isMine ? 'bg-brand-blueLight/50 font-medium' : 'bg-muted/40'
            } ${i === 0 ? 'border border-green-300' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">#{bid.bidderId}</span>
              {bid.source === 'PRESENCIAL' && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                  SALA
                </span>
              )}
              {isMine && (
                <span className="rounded bg-brand-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-blue">
                  TÚ
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold tabular-nums">{formatCLP(bid.newAmount)}</span>
              <span className="text-xs text-muted-foreground">{formatTime(bid.timestamp)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
