import Link from 'next/link';
import Image from 'next/image';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PublicAuction } from '@/lib/mock-auctions';

type AuctionCardProps = {
  auction: PublicAuction;
};

export function AuctionCard({ auction }: AuctionCardProps) {
  const cover = auction.lots[0]?.imageUrl ?? '/brand/martillo_icon.svg';

  return (
    <Card className="overflow-hidden">
      <div className="relative h-44 w-full bg-brand-blueLight">
        <Image src={cover} alt={auction.title} fill className="object-contain p-6" />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xl">{auction.title}</CardTitle>
          <StatusBadge status={auction.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {new Date(auction.date).toLocaleString('es-CL')}
        </p>
        <p className="text-sm text-muted-foreground">{auction.lots.length} lotes disponibles</p>
        <div className="flex gap-3">
          <Link
            href={`/auctions/${auction.id}`}
            className="text-sm font-medium text-primary underline"
          >
            Ver remate
          </Link>
          {auction.status === 'LIVE' && (
            <Link
              href={`/auctions/${auction.id}/live`}
              className="text-sm font-medium text-green-600 underline"
            >
              Sala en vivo
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
