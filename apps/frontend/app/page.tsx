export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">Martillo</h1>
        <p className="mt-4 text-xl text-muted-foreground">Plataforma de Subastas Híbridas</p>
        <div className="mt-8 flex gap-4 justify-center">
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-lg font-semibold">Subastas en Vivo</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Participa en subastas en tiempo real
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-lg font-semibold">Subastas Online</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Puja desde cualquier lugar
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
