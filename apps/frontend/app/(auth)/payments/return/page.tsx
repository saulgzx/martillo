import { Suspense } from 'react';
import { PaymentReturnClient } from './return-client';

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<main className="p-6">Verificando estado de pago...</main>}>
      <PaymentReturnClient />
    </Suspense>
  );
}
