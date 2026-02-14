'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { isAdminRole } from '@/lib/auth-routing';

export function AppTopbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const roleLabel = useMemo(() => {
    if (!user?.role) return 'Invitado';
    return user.role;
  }, [user?.role]);

  return (
    <header className="rounded-xl border border-border bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Logo size={32} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-brand-blueLight px-2 py-1 text-xs font-medium text-brand-navy">
            {roleLabel}
          </span>
          <Button asChild size="sm" variant="outline">
            <Link href="/">Inicio</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/auctions">Remates</Link>
          </Button>
          {isAdminRole(user?.role) ? (
            <Button asChild size="sm">
              <Link href="/admin">Panel Admin</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/my-adjudications">Mis adjudicaciones</Link>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
          >
            Cerrar sesion
          </Button>
        </div>
      </div>
    </header>
  );
}
