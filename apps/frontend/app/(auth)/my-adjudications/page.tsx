'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

type Row = {
  id: string;
  adjudicatedAt: string;
  lot: { id: string; title: string };
  payment: {
    id: string;
    status: string;
    total: string;
  } | null;
};

const money = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);

export default function MyAdjudicationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ success: boolean; data: Row[] }>('/api/adjudications/my')
      .then((response) => setRows(response.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Mis Adjudicaciones</h1>
      </header>

      <div className="space-y-3">
        {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> : null}
        {!loading && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes adjudicaciones.</p>
        ) : null}
        {rows.map((row) => (
          <article key={row.id} className="rounded-lg border border-border p-4">
            <h2 className="font-semibold">{row.lot.title}</h2>
            <p className="text-sm text-muted-foreground">
              Fecha: {new Date(row.adjudicatedAt).toLocaleString('es-CL')}
            </p>
            {row.payment ? (
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span>Estado: {row.payment.status}</span>
                <span>Total: {money(Number(row.payment.total))}</span>
                <Link href={`/payments/${row.payment.id}`} className="underline">
                  Ver pago
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Pago aun no generado.</p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
