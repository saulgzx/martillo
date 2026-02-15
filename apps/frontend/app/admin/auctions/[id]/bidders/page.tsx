'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { BidderDetailDrawer } from '@/components/admin/BidderDetailDrawer';
import { Button } from '@/components/ui/button';

type BidderRow = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BANNED';
  paddleNumber: number;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    rutMasked?: string;
    phone?: string | null;
  };
  documents: Array<{ id: string; type: string; uploadedAt: string }>;
};

export default function AdminAuctionBiddersPage() {
  const { id: auctionId } = useParams<{ id: string }>();
  const [rows, setRows] = useState<BidderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selected, setSelected] = useState<BidderRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const query = statusFilter === 'ALL' ? '' : `?status=${statusFilter}`;
      const response = await apiClient.get<{ success: boolean; data: { data: BidderRow[] } }>(
        `/api/auctions/${auctionId}/bidders${query}`,
      );
      setRows(response.data.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, statusFilter]);

  const pendingCount = useMemo(() => rows.filter((row) => row.status === 'PENDING').length, [rows]);

  return (
    <main className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Verificacion de Postores</h1>
          <p className="text-sm text-muted-foreground">Pendientes: {pendingCount}</p>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="ALL">Todos</option>
          <option value="PENDING">PENDIENTE</option>
          <option value="APPROVED">APROBADO</option>
          <option value="REJECTED">RECHAZADO</option>
          <option value="BANNED">BANEADO</option>
        </select>
      </header>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">RUT</th>
              <th className="px-3 py-2">Paleta</th>
              <th className="px-3 py-2">Docs</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-muted-foreground">
                  Sin postores
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2">{row.user.fullName}</td>
                  <td className="px-3 py-2">{row.user.rutMasked ?? '--'}</td>
                  <td className="px-3 py-2">#{row.paddleNumber}</td>
                  <td className="px-3 py-2">{row.documents.length}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2">
                    <Button size="sm" variant="outline" onClick={() => setSelected(row)}>
                      Revisar
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <BidderDetailDrawer
        open={Boolean(selected)}
        bidder={selected}
        auctionId={auctionId}
        onClose={() => setSelected(null)}
        onActionDone={load}
      />
    </main>
  );
}
