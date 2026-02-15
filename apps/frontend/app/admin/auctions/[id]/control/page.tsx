'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuctionSocket } from '@/hooks/useAuctionSocket';
import { ConnectionStatus } from '@/components/auction/ConnectionStatus';
import { PriceDisplay } from '@/components/auction/PriceDisplay';
import { BidHistory } from '@/components/auction/BidHistory';
import { Button } from '@/components/ui/button';

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);

export default function AuctioneerControlPage() {
  const { id: auctionId } = useParams<{ id: string }>();
  const {
    connectionState,
    connectedCount,
    activeLot,
    bidHistory,
    lastError,
    isPaused,
    isEnded,
    auctioneerControls,
  } = useAuctionSocket(auctionId);

  const [presencialPaddle, setPresencialPaddle] = useState('');
  const [presencialAmount, setPresencialAmount] = useState('');
  const [confirmAction, setConfirmAction] = useState<null | 'adjudicate' | 'end'>(null);

  if (isEnded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Remate finalizado</h1>
          <p className="mt-2 text-muted-foreground">Todos los lotes han sido procesados.</p>
        </div>
      </div>
    );
  }

  const currentPrice = activeLot ? Number(activeLot.currentPrice) : 0;
  const minIncrement = activeLot ? Number(activeLot.minIncrement) : 0;
  const coverImage = activeLot?.media?.find((m) => m.type === 'IMAGE');

  const handlePresencialBid = () => {
    const paddle = parseInt(presencialPaddle, 10);
    const amount = parseFloat(presencialAmount);
    if (!activeLot || isNaN(paddle) || isNaN(amount)) return;
    auctioneerControls.bidPresencial(activeLot.id, amount, paddle);
    setPresencialAmount('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Panel del Rematador</h1>
        <ConnectionStatus state={connectionState} connectedCount={connectedCount} />
      </header>

      {lastError && (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{lastError}</div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
        {/* Left: Active lot + bid history */}
        <div className="flex flex-col gap-4">
          {activeLot ? (
            <>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex gap-4">
                  {coverImage && (
                    <img
                      src={coverImage.url}
                      alt={activeLot.title}
                      className="h-32 w-32 rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      Lote #{activeLot.orderIndex}
                      {activeLot.category && ` · ${activeLot.category}`}
                    </p>
                    <h2 className="text-xl font-bold">{activeLot.title}</h2>
                    {activeLot.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {activeLot.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <PriceDisplay amount={currentPrice} label="Precio actual" size="lg" />
                </div>
              </div>

              {/* Presencial bid input */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Registrar puja presencial</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Paleta #"
                    value={presencialPaddle}
                    onChange={(e) => setPresencialPaddle(e.target.value)}
                    className="w-24 rounded-md border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    placeholder={`Monto (mín ${formatCLP(currentPrice + minIncrement)})`}
                    value={presencialAmount}
                    onChange={(e) => setPresencialAmount(e.target.value)}
                    className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  />
                  <Button
                    onClick={handlePresencialBid}
                    disabled={!presencialPaddle || !presencialAmount}
                    className="bg-brand-navy hover:bg-brand-navy/90"
                  >
                    REGISTRAR
                  </Button>
                </div>
              </div>

              {/* Bid history */}
              <div className="rounded-lg border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">Historial de pujas</h3>
                <BidHistory bids={bidHistory} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-12">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">Sin lote activo</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Presiona &quot;Siguiente lote&quot; para activar el próximo
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col gap-4">
          {/* Control buttons */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-4 text-sm font-semibold">Controles</h3>
            <div className="flex flex-col gap-3">
              {/* Adjudicate */}
              <Button
                size="lg"
                disabled={!activeLot || bidHistory.length === 0}
                onClick={() => setConfirmAction('adjudicate')}
                className="w-full bg-green-600 py-6 text-lg font-bold hover:bg-green-700"
              >
                ADJUDICAR
              </Button>

              {/* Next lot */}
              <Button
                size="lg"
                onClick={() => auctioneerControls.nextLot()}
                className="w-full bg-brand-blue py-4 font-semibold hover:bg-brand-blue/90"
              >
                SIGUIENTE LOTE
              </Button>

              {/* Skip lot */}
              <Button
                size="lg"
                variant="secondary"
                disabled={!activeLot}
                onClick={() => {
                  if (activeLot) auctioneerControls.skipLot(activeLot.id);
                }}
                className="w-full py-4 font-semibold"
              >
                SALTAR LOTE
              </Button>

              {/* Pause / Resume */}
              {isPaused ? (
                <Button
                  size="lg"
                  onClick={() => auctioneerControls.resume()}
                  className="w-full bg-green-600 py-4 font-semibold hover:bg-green-700"
                >
                  REANUDAR
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => auctioneerControls.pause()}
                  className="w-full bg-amber-500 py-4 font-semibold text-white hover:bg-amber-600"
                >
                  PAUSAR
                </Button>
              )}

              {/* End auction */}
              <Button
                size="lg"
                variant="destructive"
                onClick={() => setConfirmAction('end')}
                className="w-full py-4 font-semibold"
              >
                FINALIZAR REMATE
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold">Estado</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Postores online</span>
                <span className="font-medium">{connectedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pujas en lote actual</span>
                <span className="font-medium">{bidHistory.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <span className="font-medium">
                  {isPaused ? 'En pausa' : activeLot ? 'En vivo' : 'Esperando'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm modals */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold">
              {confirmAction === 'adjudicate' ? 'Confirmar adjudicación' : 'Finalizar remate'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {confirmAction === 'adjudicate'
                ? `¿Adjudicar el lote "${activeLot?.title}" al mejor postor por ${formatCLP(currentPrice)}?`
                : '¿Estás seguro de finalizar el remate? Los lotes restantes quedarán como no vendidos.'}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)}>
                Cancelar
              </Button>
              <Button
                className={`flex-1 ${confirmAction === 'end' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                onClick={() => {
                  if (confirmAction === 'adjudicate' && activeLot) {
                    auctioneerControls.adjudicate(activeLot.id);
                  } else if (confirmAction === 'end') {
                    auctioneerControls.end();
                  }
                  setConfirmAction(null);
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
