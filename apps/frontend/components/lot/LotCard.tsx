import Image from 'next/image';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PublicLot } from '@/lib/mock-auctions';

type LotCardProps = {
  lot: PublicLot;
};

export function LotCard({ lot }: LotCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 w-full bg-brand-blueLight">
        <Image src={lot.imageUrl} alt={lot.title} fill className="object-contain p-4" />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-lg">{lot.title}</CardTitle>
          <StatusBadge status={lot.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{lot.description}</p>
        <p className="text-sm font-semibold text-foreground">
          Base:{' '}
          {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
            lot.basePrice,
          )}
        </p>
      </CardContent>
    </Card>
  );
}
