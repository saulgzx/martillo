import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';
import { AppTopbar } from '@/components/common/AppTopbar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="bg-brand-navy p-6 text-brand-offWhite">
        <Logo size={32} variant="white" />
        <nav className="mt-8 space-y-2 text-sm">
          <Link href="/admin" className="block rounded px-3 py-2 hover:bg-white/10">
            Inicio Admin
          </Link>
          <Link href="/admin/users" className="block rounded px-3 py-2 hover:bg-white/10">
            Usuarios
          </Link>
          <Link href="/admin/auctions" className="block rounded px-3 py-2 hover:bg-white/10">
            Remates
          </Link>
          <Link href="/admin/bidders" className="block rounded px-3 py-2 hover:bg-white/10">
            Postores
          </Link>
          <Link href="/admin/payments" className="block rounded px-3 py-2 hover:bg-white/10">
            Pagos
          </Link>
          <Link
            href="/admin/profile-requests"
            className="block rounded px-3 py-2 hover:bg-white/10"
          >
            Solicitudes de perfil
          </Link>
          <Link href="/admin/notifications" className="block rounded px-3 py-2 hover:bg-white/10">
            Notificaciones
          </Link>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="mb-2 px-3 text-xs uppercase text-white/50">Acceso rapido</p>
            <Link href="/" className="block rounded px-3 py-2 hover:bg-white/10">
              Ver sitio publico
            </Link>
          </div>
        </nav>
      </aside>
      <section className="bg-background p-6">
        <div className="mb-6">
          <AppTopbar />
        </div>
        {children}
      </section>
    </main>
  );
}
