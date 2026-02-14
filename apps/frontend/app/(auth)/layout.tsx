import type { ReactNode } from 'react';
import { Logo } from '@/components/common/Logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-offWhite to-brand-blueLight px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-sm">
        <div className="mb-6 text-center">
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">
            Acceso seguro a la plataforma de subastas
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
