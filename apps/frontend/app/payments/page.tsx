import { AppTopbar } from '@/components/common/AppTopbar';

export const dynamic = 'force-dynamic';

export default function PaymentsIndexPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <AppTopbar />

      <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Pagos</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aqui veras tus pagos asociados a adjudicaciones. Por ahora, la navegacion se realiza desde{' '}
          <span className="font-medium text-foreground">Mis adjudicaciones</span> hacia el detalle
          del pago.
        </p>
      </section>
    </main>
  );
}
