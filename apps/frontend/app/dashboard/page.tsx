'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { isAdminRole } from '@/lib/auth-routing';
import { AppTopbar } from '@/components/common/AppTopbar';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      void useAuthStore.getState().refreshToken();
      return;
    }

    if (isAdminRole(user.role)) {
      router.replace('/admin');
    }
  }, [router, user]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <AppTopbar />

      <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Panel de cliente</h1>
        <p className="mt-2 text-muted-foreground">
          Sesion activa como {user?.fullName ?? 'usuario autenticado'}.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/auctions"
          className="rounded-xl border border-border bg-background p-5 shadow-sm transition hover:border-brand-blue hover:shadow"
        >
          <h2 className="text-base font-semibold text-foreground">Explorar remates</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ver catalogo, fichas y lotes activos.
          </p>
        </Link>

        <Link
          href="/my-adjudications"
          className="rounded-xl border border-border bg-background p-5 shadow-sm transition hover:border-brand-blue hover:shadow"
        >
          <h2 className="text-base font-semibold text-foreground">Mis adjudicaciones</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Revisar lotes ganados y estado de pago.
          </p>
        </Link>

        <Link
          href="/payments"
          className="rounded-xl border border-border bg-background p-5 shadow-sm transition hover:border-brand-blue hover:shadow"
        >
          <h2 className="text-base font-semibold text-foreground">Pagos</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acceso rapido al flujo de confirmacion y retorno.
          </p>
        </Link>

        <Link
          href="/profile"
          className="rounded-xl border border-border bg-background p-5 shadow-sm transition hover:border-brand-blue hover:shadow"
        >
          <h2 className="text-base font-semibold text-foreground">Perfil</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Editar datos personales y revisar estado actual.
          </p>
        </Link>
      </section>
    </main>
  );
}
