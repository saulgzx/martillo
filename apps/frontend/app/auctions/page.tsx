import { AppTopbar } from '@/components/common/AppTopbar';
import { AuctionCard } from '@/components/auction/AuctionCard';
import { mockAuctions, type PublicAuction } from '@/lib/mock-auctions';

export const dynamic = 'force-dynamic';

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

async function getPublicAuctions(): Promise<PublicAuction[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return mockAuctions;

  try {
    const json = await fetchJsonWithTimeout<unknown>(`${apiUrl}/api/auctions/public`, 1500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auctions = (json as any).data ?? json;
    if (!Array.isArray(auctions) || auctions.length === 0) return mockAuctions;

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

export default async function AuctionsPage() {
  const auctions = await getPublicAuctions();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <AppTopbar />

      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-foreground">Remates activos y proximos</h1>
        <p className="text-sm text-muted-foreground">
          Explora los remates publicados y entra al detalle de cada catalogo.
        </p>
      </section>

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
    </main>
  );
}
