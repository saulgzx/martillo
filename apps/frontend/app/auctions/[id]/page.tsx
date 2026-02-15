import { notFound } from 'next/navigation';
import { LotCard } from '@/components/lot/LotCard';
import { mockAuctions } from '@/lib/mock-auctions';
import { BidderStatusGate } from '@/components/bidder/BidderStatusGate';
import { AppTopbar } from '@/components/common/AppTopbar';

export function generateStaticParams() {
  return mockAuctions.map((auction) => ({ id: auction.id }));
}

export default function AuctionDetailPage({ params }: { params: { id: string } }) {
  const auction = mockAuctions.find((item) => item.id === params.id);
  if (!auction) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-8 px-6 py-10">
      <AppTopbar />
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-foreground">{auction.title}</h1>
        <p className="text-sm text-muted-foreground">
          Fecha: {new Date(auction.date).toLocaleString('es-CL')}
        </p>
        <details className="rounded-lg border border-border p-4 text-sm">
          <summary className="cursor-pointer font-medium">Condiciones del remate</summary>
          <p className="mt-2 text-muted-foreground">{auction.terms}</p>
        </details>
        <BidderStatusGate auctionId={auction.id} />
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {auction.lots.map((lot) => (
          <LotCard key={lot.id} lot={lot} />
        ))}
      </section>
    </main>
  );
}
