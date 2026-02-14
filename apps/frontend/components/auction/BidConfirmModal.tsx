'use client';

import { Button } from '@/components/ui/button';

type Props = {
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n);

export function BidConfirmModal({ amount, onConfirm, onCancel, isLoading }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-card-foreground">Confirmar puja</h3>
        <p className="mt-2 text-sm text-muted-foreground">Vas a pujar por:</p>
        <p className="mt-1 text-3xl font-bold text-foreground">{formatCLP(amount)}</p>
        <p className="mt-2 text-xs text-muted-foreground">Esta acciÃ³n no se puede deshacer.</p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Enviando...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
