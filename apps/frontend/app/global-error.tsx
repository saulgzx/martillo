'use client';

import React from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    console.error('[frontend] global error boundary:', error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Error critico</h2>
          <p className="text-sm text-muted-foreground">
            Se produjo una falla global en la aplicacion.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
