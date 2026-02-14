'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

type PaymentData = {
  id: string;
  status: string;
};

export function PaymentReturnClient() {
  const params = useSearchParams();
  const paymentId = params.get('paymentId');

  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paymentId) {
      setLoading(false);
      return;
    }
    apiClient
      .get<{ success: boolean; data: PaymentData }>(`/api/payments/${paymentId}`)
      .then((response) => setPayment(response.data.data))
      .finally(() => setLoading(false));
  }, [paymentId]);

  if (loading) return <main className="p-6">Verificando estado de pago...</main>;

  if (!paymentId) {
    return <main className="p-6">Retorno invalido: falta paymentId.</main>;
  }

  const status = payment?.status ?? 'UNKNOWN';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 px-6 py-10">
      {status === 'PAID' ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <h1 className="text-xl font-semibold">Pago confirmado</h1>
          <p className="mt-1 text-sm">Tu transaccion fue registrada correctamente.</p>
        </section>
      ) : (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <h1 className="text-xl font-semibold">Pago no confirmado</h1>
          <p className="mt-1 text-sm">Estado actual: {status}</p>
        </section>
      )}

      <div className="flex gap-3 text-sm">
        <Link href={`/payments/${paymentId}`} className="underline">
          Ver detalle del pago
        </Link>
        <Link href="/my-adjudications" className="underline">
          Ir a mis adjudicaciones
        </Link>
      </div>
    </main>
  );
}
