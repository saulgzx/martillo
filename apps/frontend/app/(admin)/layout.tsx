import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="bg-brand-navy p-6 text-brand-offWhite">
        <Logo size={32} />
        <nav className="mt-8 space-y-2 text-sm">
          <Link href="/admin/auctions" className="block rounded px-3 py-2 hover:bg-white/10">
            Remates
          </Link>
          <Link href="/admin/payments" className="block rounded px-3 py-2 hover:bg-white/10">
            Pagos
          </Link>
          <Link href="/dashboard" className="block rounded px-3 py-2 hover:bg-white/10">
            Dashboard
          </Link>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 px-3 text-xs uppercase text-white/50">Acceso rápido</p>
            <Link href="/" className="block rounded px-3 py-2 hover:bg-white/10">
              Ver sitio público
            </Link>
          </div>
        </nav>
      </aside>
      <section className="bg-background p-6">{children}</section>
    </main>
  );
}
