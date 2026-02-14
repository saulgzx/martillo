'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';

type PaymentData = {
  id: string;
  amount: string;
  commission: string;
  tax: string;
  total: string;
  status: string;
  providerData?: {
    flowUrl?: string;
    expiresAt?: string;
  };
  adjudication: {
    lot: {
      title: string;
      description?: string | null;
    };
  };
};

const money = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get<{ success: boolean; data: PaymentData }>(`/api/payments/${id}`)
      .then((response) => setPayment(response.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  const countdown = useMemo(() => {
    const expiresAt = payment?.providerData?.expiresAt;
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Vencido';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours}h ${minutes}m`;
  }, [payment]);

  if (loading) return <main className="p-6">Cargando...</main>;
  if (!payment) return <main className="p-6">Pago no encontrado</main>;

  const flowUrl = payment.providerData?.flowUrl;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Detalle de Pago</h1>
        <p className="text-sm text-muted-foreground">{payment.adjudication.lot.title}</p>
      </header>

      <section className="space-y-2 rounded-lg border border-border p-4 text-sm">
        <p>Precio adjudicacion: {money(Number(payment.amount))}</p>
        <p>Comision: {money(Number(payment.commission))}</p>
        <p>IVA: {money(Number(payment.tax))}</p>
        <p className="text-base font-bold">TOTAL: {money(Number(payment.total))}</p>
        <p>Estado: {payment.status}</p>
        {countdown ? <p>Tiempo para pagar: {countdown}</p> : null}
      </section>

      {flowUrl ? (
        <a href={flowUrl} target="_blank" rel="noreferrer">
          <Button>Pagar con Flow</Button>
        </a>
      ) : (
        <Button variant="outline" disabled>
          Enlace de pago no disponible
        </Button>
      )}
    </main>
  );
}
