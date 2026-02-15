'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { ProfileChangeRequest } from '@martillo/shared';

type ListResponse = {
  success: boolean;
  data: {
    total: number;
    page: number;
    data: Array<
      ProfileChangeRequest & {
        user: { id: string; email: string; fullName: string; phone?: string | null };
      }
    >;
  };
};

export default function AdminProfileRequestsPage() {
  const [items, setItems] = useState<ListResponse['data']['data']>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = useMemo(() => items.length, [items.length]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ListResponse>(
        '/api/admin/profile-change-requests?status=PENDING',
      );
      setItems(res.data.data.data);
    } catch {
      setError('No se pudieron cargar solicitudes.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(id: string) {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/api/admin/profile-change-requests/${id}/approve`);
      await load();
    } catch {
      setError('No se pudo aprobar la solicitud.');
    } finally {
      setLoading(false);
    }
  }

  async function reject(id: string) {
    const reason = window.prompt('Motivo de rechazo (obligatorio):');
    if (!reason || reason.trim().length < 3) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/api/admin/profile-change-requests/${id}/reject`, { reason });
      await load();
    } catch {
      setError('No se pudo rechazar la solicitud.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Solicitudes de cambio de perfil</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pendientes: <span className="font-medium">{pendingCount}</span>
        </p>
        <div className="mt-4">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay solicitudes pendientes.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((req) => (
              <div key={req.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{req.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{req.user.email}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Cambio solicitado:</p>
                      {req.requestedFullName ? <p>- Nombre: {req.requestedFullName}</p> : null}
                      {req.requestedEmail ? <p>- Email: {req.requestedEmail}</p> : null}
                      {req.requestedPhone ? <p>- Telefono: {req.requestedPhone}</p> : null}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => void approve(req.id)} disabled={loading}>
                      Aprobar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => void reject(req.id)}
                      disabled={loading}
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
