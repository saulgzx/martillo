'use client';

import { useEffect } from 'react';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[frontend] route error boundary:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-2xl font-semibold text-foreground">Algo salio mal</h2>
      <p className="text-sm text-muted-foreground">Ocurrio un error inesperado en esta vista.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Reintentar
      </button>
    </div>
  );
}
