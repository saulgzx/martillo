'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
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
    lastError: socketError,
    isPaused,
    pauseReason,
    isEnded,
    auctioneerControls,
  } = useAuctionSocket(auctionId);

  const [busy, setBusy] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    null | 'adjudicate' | 'skip' | 'pause' | 'resume' | 'end'
  >(null);

  const coverImage = useMemo(
    () => activeLot?.media?.find((m) => m.type === 'IMAGE') ?? null,
    [activeLot],
  );

  const currentPrice = activeLot ? Number(activeLot.currentPrice) : 0;
  const minIncrement = activeLot ? Number(activeLot.minIncrement) : 0;

  const handleNextLot = async () => {
    setBusy(true);
    setUiError(null);
    try {
      // Prefer socket (true real-time), fallback to REST (dev scaffolding).
      if (connectionState === 'connected') {
        auctioneerControls.nextLot();
        return;
      }
      await apiClient.post(`/api/auctions/${auctionId}/lots/next`);
    } catch {
      setUiError('No se pudo activar el siguiente lote.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Panel del Rematador</h1>
        <ConnectionStatus state={connectionState} connectedCount={connectedCount} />
      </header>

      {socketError ? (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{socketError}</div>
      ) : null}
      {uiError ? (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{uiError}</div>
      ) : null}
      {isEnded ? (
        <div className="rounded-md bg-slate-50 px-4 py-2 text-sm text-slate-700">
          Remate finalizado.
        </div>
      ) : isPaused ? (
        <div className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Subasta en pausa{pauseReason ? `: ${pauseReason}` : '.'}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-4">
          {activeLot ? (
            <>
              <div className="rounded-lg border bg-card p-4">
                <div className="flex gap-4">
                  {coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImage.url}
                      alt={activeLot.title}
                      className="h-32 w-32 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-md bg-muted" />
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      Lote #{activeLot.orderIndex}
                      {activeLot.category ? ` - ${activeLot.category}` : ''}
                    </p>
                    <h2 className="text-xl font-bold">{activeLot.title}</h2>
                    {activeLot.description ? (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {activeLot.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4">
                  <PriceDisplay amount={currentPrice} label="Precio actual" size="lg" />
                </div>
              </div>

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
                  Presiona Siguiente lote para activar el proximo.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-4 text-sm font-semibold">Controles</h3>
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                disabled={
                  !activeLot ||
                  bidHistory.length === 0 ||
                  connectionState !== 'connected' ||
                  isPaused ||
                  isEnded
                }
                onClick={() => setConfirmAction('adjudicate')}
                className="w-full bg-green-600 py-6 text-lg font-bold hover:bg-green-700"
              >
                ADJUDICAR
              </Button>

              <Button
                size="lg"
                onClick={() => void handleNextLot()}
                disabled={busy || isPaused || isEnded}
                className="w-full bg-brand-blue py-4 font-semibold hover:bg-brand-blue/90"
              >
                {busy ? 'ACTIVANDO...' : 'SIGUIENTE LOTE'}
              </Button>

              <Button
                size="lg"
                variant="secondary"
                disabled={!activeLot || connectionState !== 'connected' || isEnded}
                onClick={() => setConfirmAction('skip')}
                className="w-full py-4 font-semibold"
              >
                SALTAR LOTE
              </Button>

              <Button
                size="lg"
                disabled={connectionState !== 'connected' || isEnded}
                onClick={() => setConfirmAction(isPaused ? 'resume' : 'pause')}
                className={
                  isPaused
                    ? 'w-full bg-emerald-600 py-4 font-semibold text-white hover:bg-emerald-700'
                    : 'w-full bg-amber-500 py-4 font-semibold text-white hover:bg-amber-600'
                }
              >
                {isPaused ? 'REANUDAR' : 'PAUSAR'}
              </Button>

              <Button
                size="lg"
                variant="destructive"
                disabled={connectionState !== 'connected' || isEnded}
                onClick={() => setConfirmAction('end')}
                className="w-full py-4 font-semibold"
              >
                FINALIZAR REMATE
              </Button>
            </div>
            {activeLot ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Incremento minimo: {formatCLP(minIncrement)}
              </p>
            ) : null}
          </div>

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
                  {activeLot
                    ? 'En vivo'
                    : connectionState === 'connected'
                      ? 'Esperando'
                      : 'Sin conexión'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold">
              {confirmAction === 'adjudicate'
                ? 'Confirmar adjudicacion'
                : confirmAction === 'skip'
                  ? 'Saltar lote'
                  : confirmAction === 'pause'
                    ? 'Pausar subasta'
                    : confirmAction === 'resume'
                      ? 'Reanudar subasta'
                      : 'Finalizar remate'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {confirmAction === 'adjudicate'
                ? `Adjudicar el lote ${activeLot?.title ?? ''} por ${formatCLP(currentPrice)}?`
                : confirmAction === 'skip'
                  ? `Marcar el lote ${activeLot?.title ?? ''} como no vendido y avanzar?`
                  : confirmAction === 'pause'
                    ? 'Pausar la subasta para todos los participantes?'
                    : confirmAction === 'resume'
                      ? 'Reanudar la subasta para todos los participantes?'
                      : 'Estas seguro de finalizar el remate?'}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)}>
                Cancelar
              </Button>
              <Button
                className={`flex-1 ${
                  confirmAction === 'end'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmAction === 'pause'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : confirmAction === 'resume'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-green-600 hover:bg-green-700'
                }`}
                onClick={() => {
                  setUiError(null);

                  if (connectionState !== 'connected') {
                    setUiError('Sin conexion al motor en tiempo real.');
                    setConfirmAction(null);
                    return;
                  }

                  if (confirmAction === 'adjudicate' && activeLot) {
                    auctioneerControls.adjudicate(activeLot.id);
                    setConfirmAction(null);
                    return;
                  }

                  if (confirmAction === 'skip' && activeLot) {
                    auctioneerControls.skipLot(activeLot.id);
                    setConfirmAction(null);
                    return;
                  }

                  if (confirmAction === 'pause') {
                    auctioneerControls.pause();
                    setConfirmAction(null);
                    return;
                  }

                  if (confirmAction === 'resume') {
                    auctioneerControls.resume();
                    setConfirmAction(null);
                    return;
                  }

                  if (confirmAction === 'end') {
                    auctioneerControls.end();
                    setConfirmAction(null);
                    return;
                  }

                  setConfirmAction(null);
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
