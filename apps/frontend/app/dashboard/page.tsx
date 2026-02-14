'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/common/Logo';
import { useAuthStore } from '@/store/auth.store';
import { isAdminRole } from '@/lib/auth-routing';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!user) {
      void useAuthStore.getState().refreshToken();
      return;
    }

    if (isAdminRole(user.role)) {
      router.replace('/admin/auctions');
    }
  }, [router, user]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <Logo size={36} />
        <Button
          variant="outline"
          onClick={async () => {
            await logout();
            router.push('/login');
          }}
        >
          Cerrar sesión
        </Button>
      </header>

      <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Sesión activa como {user?.fullName ?? 'usuario autenticado'}.
        </p>
      </section>
    </main>
  );
}
