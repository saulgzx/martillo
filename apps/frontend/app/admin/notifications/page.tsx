'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';

type NotificationRow = {
  id: string;
  type: string;
  payload: unknown;
  sentAt: string;
  readAt: string | null;
};

function renderSummary(item: NotificationRow): { title: string; href?: string } {
  if (item.type === 'PROFILE_CHANGE_REQUEST_CREATED') {
    return { title: 'Nueva solicitud de cambio de perfil', href: '/admin/profile-requests' };
  }
  if (item.type === 'BIDDER_APPLICATION_CREATED') {
    const payload = item.payload as { auctionId?: string } | null;
    const auctionId = payload?.auctionId;
    return auctionId
      ? {
          title: `Nueva solicitud de postor (${auctionId})`,
          href: `/admin/auctions/${auctionId}/bidders`,
        }
      : { title: 'Nueva solicitud de postor' };
  }
  return { title: item.type };
}

type ListResponse = {
  success: boolean;
  data: {
    total: number;
    unreadTotal: number;
    page: number;
    data: NotificationRow[];
  };
};

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ListResponse>('/api/admin/notifications?limit=50');
      setItems(res.data.data.data);
      setUnreadTotal(res.data.data.unreadTotal);
    } catch {
      setError('No se pudieron cargar notificaciones.');
      setItems([]);
      setUnreadTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/api/admin/notifications/read-all');
      await load();
    } catch {
      setError('No se pudieron marcar como leidas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Notificaciones</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No leidas: <span className="font-medium">{unreadTotal}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Button onClick={() => void markAllRead()} disabled={loading || unreadTotal === 0}>
            Marcar todo como leido
          </Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay notificaciones.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border border-border p-4 ${item.readAt ? 'opacity-70' : ''}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    {(() => {
                      const summary = renderSummary(item);
                      return summary.href ? (
                        <a
                          href={summary.href}
                          className="text-sm font-semibold text-foreground underline"
                        >
                          {summary.title}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-foreground">{summary.title}</p>
                      );
                    })()}
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.sentAt).toLocaleString('es-CL')}
                    </p>
                  </div>
                  {!item.readAt ? (
                    <span className="rounded-full bg-brand-blueLight px-2.5 py-1 text-xs font-semibold text-brand-text">
                      NUEVA
                    </span>
                  ) : null}
                </div>
                <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                  {JSON.stringify(item.payload, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
