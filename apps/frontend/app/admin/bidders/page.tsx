'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';

type BidderRow = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED';
  paddleNumber: number;
  createdAt: string;
  auction: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    email: string;
    fullName: string;
    rutMasked?: string;
    phone?: string | null;
  };
};

type ListResponse = {
  success: boolean;
  data: {
    total: number;
    page: number;
    data: BidderRow[];
  };
};

export default function AdminBiddersPage() {
  const [items, setItems] = useState<BidderRow[]>([]);
  const [status, setStatus] = useState<'ALL' | BidderRow['status']>('PENDING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '50');
    if (status !== 'ALL') params.set('status', status);
    return params.toString();
  }, [status]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ListResponse>(`/api/bidders?${query}`);
      setItems(res.data.data.data);
    } catch {
      setError('No se pudieron cargar solicitudes de postores.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Postores</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Revisa solicitudes y accede al modulo de verificacion por remate.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="BANNED">Baneado</option>
            </select>
          </div>

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
          <p className="py-6 text-center text-sm text-muted-foreground">No hay solicitudes.</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-3 py-2">Remate</th>
                  <th className="px-3 py-2">Postor</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">RUT</th>
                  <th className="px-3 py-2">Paleta</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-3">
                      <div className="font-medium text-foreground">{row.auction.title}</div>
                      <div className="text-xs text-muted-foreground">{row.auction.id}</div>
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground">{row.user.fullName}</td>
                    <td className="px-3 py-3 text-muted-foreground">{row.user.email}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {row.user.rutMasked ?? '--'}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">#{row.paddleNumber}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/admin/auctions/${row.auction.id}/bidders`}
                        className="text-primary underline"
                      >
                        Abrir verificacion
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
