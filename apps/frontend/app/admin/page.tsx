import Link from 'next/link';

const adminModules = [
  {
    href: '/admin/auctions',
    title: 'Remates',
    description: 'Crear, editar, publicar y controlar remates.',
  },
  {
    href: '/admin/payments',
    title: 'Pagos',
    description: 'Monitorear estados de pago y acciones manuales.',
  },
  {
    href: '/admin/auctions',
    title: 'Postores',
    description: 'Desde Remates, ingresar al modulo de postores por cada subasta.',
  },
  {
    href: '/admin/auctions',
    title: 'Control en vivo',
    description: 'Desde Remates, abrir control en vivo por subasta.',
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Panel administrativo</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acceso central para operacion y pruebas funcionales de la plataforma.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {adminModules.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-xl border border-border bg-background p-5 shadow-sm transition hover:border-brand-blue hover:shadow"
          >
            <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
