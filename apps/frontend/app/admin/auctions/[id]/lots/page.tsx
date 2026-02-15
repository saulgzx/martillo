'use client';

import { useMemo, useState } from 'react';
import { LotCard } from '@/components/lot/LotCard';
import { LotForm } from '@/components/lot/LotForm';
import { mockAuctions } from '@/lib/mock-auctions';

export default function AdminLotsPage({ params }: { params: { id: string } }) {
  const auction = useMemo(() => mockAuctions.find((item) => item.id === params.id), [params.id]);
  const [showForm, setShowForm] = useState(false);

  if (!auction) {
    return <p className="text-sm text-muted-foreground">Remate no encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Lotes - {auction.title}</h1>
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => setShowForm((value) => !value)}
        >
          {showForm ? 'Cerrar formulario' : 'Agregar Lote'}
        </button>
      </header>

      {showForm ? (
        <section className="rounded-lg border border-border p-4">
          <LotForm />
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {auction.lots.map((lot) => (
          <LotCard key={lot.id} lot={lot} />
        ))}
      </section>
    </div>
  );
}
