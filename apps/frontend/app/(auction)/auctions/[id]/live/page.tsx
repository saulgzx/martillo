'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuctionSocket } from '@/hooks/useAuctionSocket';
import { ConnectionStatus } from '@/components/auction/ConnectionStatus';
import { PriceDisplay } from '@/components/auction/PriceDisplay';
import { BidHistory } from '@/components/auction/BidHistory';
import { BidConfirmModal } from '@/components/auction/BidConfirmModal';
import { Button } from '@/components/ui/button';

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);

export default function LiveAuctionPage() {
  const { id: auctionId } = useParams<{ id: string }>();
  const {
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
  } = useAuctionSocket(auctionId);

  const [showConfirm, setShowConfirm] = useState(false);
  const [bidLoading, setBidLoading] = useState(false);

  if (isEnded) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Remate finalizado</h1>
          <p className="mt-2 text-muted-foreground">Gracias por participar.</p>
        </div>
      </main>
    );
  }

  const currentPrice = activeLot ? Number(activeLot.currentPrice) : 0;
  const minIncrement = activeLot ? Number(activeLot.minIncrement) : 0;
  const nextBidAmount = currentPrice + minIncrement;
  const canBid = connectionState === 'connected' && activeLot && !isPaused;
  const coverImage = activeLot?.media?.find((m) => m.type === 'IMAGE');

  const handleBid = () => {
    setBidLoading(true);
    placeBid(activeLot!.id, nextBidAmount);
    setShowConfirm(false);
    setTimeout(() => setBidLoading(false), 2000);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-foreground">Sala en Vivo</h1>
          {paddleNumber && (
            <span className="rounded-md bg-brand-navy px-3 py-1 text-sm font-bold text-white">
              Paleta #{paddleNumber}
            </span>
          )}
        </div>
        <ConnectionStatus state={connectionState} connectedCount={connectedCount} />
      </header>

      {/* Error banner */}
      {lastError && (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{lastError}</div>
      )}

      {/* Paused banner */}
      {isPaused && (
        <div className="rounded-md bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
          Subasta en pausa{pauseReason ? `: ${pauseReason}` : ''}
        </div>
      )}

      {/* Won lot toast */}
      {wonLot && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4">
          <p className="font-semibold text-green-800">Ganaste: {wonLot.lotTitle}</p>
          <p className="text-sm text-green-700">
            Total a pagar: {formatCLP(wonLot.total)} — Tienes 48h para pagar.
          </p>
          <Button size="sm" className="mt-2" onClick={() => setWonLot(null)}>
            Entendido
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-[1fr_360px]">
        {/* Left: Active lot */}
        <div className="flex flex-col gap-4">
          {activeLot ? (
            <>
              {/* Lot image */}
              {coverImage && (
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={coverImage.url}
                    alt={activeLot.title}
                    className="h-64 w-full object-cover md:h-80"
                  />
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">
                  Lote #{activeLot.orderIndex}
                  {activeLot.category && ` · ${activeLot.category}`}
                </p>
                <h2 className="text-2xl font-bold text-foreground">{activeLot.title}</h2>
                {activeLot.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{activeLot.description}</p>
                )}
              </div>

              {/* Price */}
              <PriceDisplay amount={currentPrice} label="Precio actual" size="xl" />

              {/* Bid button */}
              <div className="flex flex-col items-center gap-2">
                <Button
                  size="lg"
                  disabled={!canBid || bidLoading}
                  onClick={() => setShowConfirm(true)}
                  className="w-full max-w-xs bg-green-600 py-6 text-lg font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  {bidLoading ? 'Enviando...' : `PUJAR ${formatCLP(nextBidAmount)}`}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Incremento mínimo: {formatCLP(minIncrement)}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-12">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  Esperando próximo lote...
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  El rematador activará el siguiente lote
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Bid history */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">Historial de pujas</h3>
            <BidHistory bids={bidHistory} myPaddle={paddleNumber} />
          </div>
        </aside>
      </div>

      {/* Confirm modal */}
      {showConfirm && activeLot && (
        <BidConfirmModal
          amount={nextBidAmount}
          onConfirm={handleBid}
          onCancel={() => setShowConfirm(false)}
          isLoading={bidLoading}
        />
      )}
    </main>
  );
}
