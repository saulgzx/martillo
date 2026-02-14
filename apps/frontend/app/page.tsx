import { AuctionCard } from '@/components/auction/AuctionCard';
import type { PublicAuction } from '@/lib/mock-auctions';
import { mockAuctions } from '@/lib/mock-auctions';

async function getPublicAuctions(): Promise<PublicAuction[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return mockAuctions;

  try {
    const res = await fetch(`${apiUrl}/api/auctions/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return mockAuctions;

    const json = await res.json();
    const auctions = json.data ?? json;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return auctions.map((a: any) => ({
      id: a.id,
      title: a.title,
      date: a.startAt,
      status: a.status,
      terms: a.terms || '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lots: Array.isArray(a.lots)
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          a.lots.map((l: any) => ({
            id: l.id,
            title: l.title,
            basePrice: Number(l.basePrice),
            status: l.status,
            imageUrl:
              Array.isArray(l.media) && l.media.length > 0
                ? l.media[0].url
                : '/brand/martillo_icon.svg',
            description: l.description || '',
          }))
        : [],
    }));
  } catch {
    return mockAuctions;
  }
}

export default async function Home() {
  const auctions = await getPublicAuctions();

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
        {auctions.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No hay remates disponibles en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
