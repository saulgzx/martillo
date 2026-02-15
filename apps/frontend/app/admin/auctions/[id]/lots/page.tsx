'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { LotForm } from '@/components/lot/LotForm';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';

type LotMedia = {
  id: string;
  type: string;
  url: string;
  orderIndex: number;
};

type Lot = {
  id: string;
  title: string;
  description?: string | null;
  basePrice: string | number;
  minIncrement: string | number;
  currentPrice: string | number;
  status: string;
  orderIndex: number;
  category?: string | null;
  media: LotMedia[];
};

type Auction = {
  id: string;
  title: string;
  status: string;
  lots: Lot[];
};

function formatCLP(amount: string | number): string {
  const n = typeof amount === 'number' ? amount : Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(safe);
}

export default function AdminLotsPage() {
  const { id: auctionId } = useParams<{ id: string }>();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lot | null>(null);

  const canDeleteLots = auction?.status === 'DRAFT';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ success: boolean; data: Auction }>(
        `/api/auctions/${auctionId}`,
      );
      setAuction(response.data.data);
    } catch {
      setError('No se pudo cargar el remate.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId]);

  const sortedLots = useMemo(() => {
    if (!auction) return [];
    return [...(auction.lots ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [auction]);

  const handleCreateLot = async (values: {
    title: string;
    description: string;
    basePrice: string;
    minIncrement: string;
    category: string;
    files: File[];
  }) => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        basePrice: values.basePrice,
        minIncrement: values.minIncrement,
        category: values.category || undefined,
      };

      const createResponse = await apiClient.post<{ success: boolean; data: Lot }>(
        `/api/auctions/${auctionId}/lots`,
        payload,
      );

      const created = createResponse.data.data;
      if (values.files.length > 0) {
        const fd = new FormData();
        values.files.forEach((file) => fd.append('files', file));
        await apiClient.post(`/api/lots/${created.id}/media`, fd);
      }

      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400)
        setError('Revisa los datos del lote (precio base e incremento son obligatorios).');
      else if (status === 401) setError('Tu sesión expiró. Inicia sesión nuevamente.');
      else if (status === 403) setError('No tienes permisos para crear lotes.');
      else setError('No se pudo guardar el lote.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLot = async (
    lotId: string,
    values: {
      title: string;
      description: string;
      basePrice: string;
      minIncrement: string;
      category: string;
      files: File[];
    },
  ) => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        basePrice: values.basePrice,
        minIncrement: values.minIncrement,
        category: values.category || undefined,
      };

      await apiClient.put(`/api/auctions/${auctionId}/lots/${lotId}`, payload);

      if (values.files.length > 0) {
        const fd = new FormData();
        values.files.forEach((file) => fd.append('files', file));
        await apiClient.post(`/api/lots/${lotId}/media`, fd);
      }

      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) setError('Revisa los datos del lote.');
      else if (status === 401) setError('Tu sesión expiró. Inicia sesión nuevamente.');
      else if (status === 403) setError('No tienes permisos para editar lotes.');
      else setError('No se pudo actualizar el lote.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishLot = async (lotId: string) => {
    setPublishing(lotId);
    setError(null);
    try {
      await apiClient.post(`/api/lots/${lotId}/publish`);
      await load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) setError('El lote debe estar en DRAFT para publicarse.');
      else if (status === 401) setError('Tu sesión expiró. Inicia sesión nuevamente.');
      else if (status === 403) setError('No tienes permisos para publicar lotes.');
      else setError('No se pudo publicar el lote.');
    } finally {
      setPublishing(null);
    }
  };

  const handleDeleteLot = async (lotId: string) => {
    if (!canDeleteLots) {
      setError('Solo puedes eliminar lotes cuando el remate está en DRAFT.');
      return;
    }

    setError(null);
    try {
      await apiClient.delete(`/api/auctions/${auctionId}/lots/${lotId}`);
      await load();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) setError('No se puede eliminar: el remate no está en DRAFT.');
      else if (status === 401) setError('Tu sesión expiró. Inicia sesión nuevamente.');
      else if (status === 403) setError('No tienes permisos para eliminar lotes.');
      else setError('No se pudo eliminar el lote.');
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>;
  }

  if (!auction) {
    return <p className="text-sm text-muted-foreground">Remate no encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Lotes</h1>
          <p className="text-sm text-muted-foreground">
            Remate: <span className="font-medium text-foreground">{auction.title}</span> ·{' '}
            <span className="font-medium">{auction.status}</span>
          </p>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditing(null);
              return;
            }
            setEditing(null);
            setShowForm(true);
          }}
          className="self-start md:self-auto"
        >
          {showForm ? 'Cerrar' : 'Agregar lote'}
        </Button>
      </header>

      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      {showForm ? (
        <section className="rounded-lg border border-border p-4">
          <LotForm
            key={editing?.id ?? 'create'}
            initialValues={
              editing
                ? {
                    title: editing.title,
                    description: editing.description ?? '',
                    basePrice: String(editing.basePrice ?? ''),
                    minIncrement: String(editing.minIncrement ?? ''),
                    category: editing.category ?? '',
                  }
                : undefined
            }
            onSubmit={(values) => {
              if (editing) return handleUpdateLot(editing.id, values);
              return handleCreateLot(values);
            }}
            submitting={saving}
            submitLabel={editing ? 'Guardar cambios' : 'Guardar lote'}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Nota: la eliminación de lotes solo está habilitada cuando el remate está en estado
            DRAFT.
          </p>
        </section>
      ) : null}

      {sortedLots.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No hay lotes aún.
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sortedLots.map((lot) => {
            const cover = lot.media?.find((m) => m.type === 'IMAGE') ?? null;
            return (
              <div key={lot.id} className="overflow-hidden rounded-lg border bg-card">
                <div className="relative h-44 w-full bg-brand-blueLight">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.url} alt={lot.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Image
                        src="/martillo_icon.svg"
                        alt="Martillo"
                        width={88}
                        height={88}
                        className="opacity-70"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Lote #{lot.orderIndex}</p>
                      <h3 className="text-base font-semibold">{lot.title}</h3>
                    </div>
                    <StatusBadge status={lot.status as never} />
                  </div>

                  {lot.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">{lot.description}</p>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Base</p>
                      <p className="font-medium">{formatCLP(lot.basePrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Incremento</p>
                      <p className="font-medium">{formatCLP(lot.minIncrement)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{lot.category ?? ''}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(lot);
                          setShowForm(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void handlePublishLot(lot.id)}
                        disabled={lot.status !== 'DRAFT' || publishing === lot.id}
                        title={
                          lot.status === 'DRAFT' ? 'Publicar lote' : 'El lote no está en DRAFT'
                        }
                      >
                        {publishing === lot.id ? 'Publicando...' : 'Publicar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeleteLot(lot.id)}
                        disabled={!canDeleteLots}
                        title={
                          canDeleteLots
                            ? 'Eliminar lote'
                            : 'Solo puedes eliminar lotes cuando el remate está en DRAFT'
                        }
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
