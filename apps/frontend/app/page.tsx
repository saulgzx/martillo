import { AuctionCard } from '@/components/auction/AuctionCard';
import { mockAuctions } from '@/lib/mock-auctions';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="rounded-2xl bg-brand-navy px-8 py-10 text-brand-offWhite">
        <h1 className="text-4xl font-bold tracking-tight">Martillo</h1>
        <p className="mt-3 max-w-2xl text-base text-brand-blueLight">
          Plataforma de subastas hibridas para operaciones en vivo y online con foco en seguridad,
          trazabilidad y velocidad.
        </p>
        <a
          href="#remates"
          className="mt-6 inline-flex rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white"
        >
          Ver remates activos
        </a>
      </section>

      <section id="remates" className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Remates activos y proximos</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {mockAuctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      </section>
    </main>
  );
}
