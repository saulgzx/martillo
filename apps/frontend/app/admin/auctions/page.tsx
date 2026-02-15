import Link from 'next/link';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { mockAuctions } from '@/lib/mock-auctions';

export default function AdminAuctionsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Gestion de Remates</h1>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Nuevo Remate
        </button>
      </header>

      <DataTable
        rows={mockAuctions}
        rowKey={(row) => row.id}
        columns={[
          { key: 'title', header: 'Titulo', render: (row) => row.title },
          {
            key: 'date',
            header: 'Fecha',
            render: (row) => new Date(row.date).toLocaleString('es-CL'),
          },
          {
            key: 'status',
            header: 'Estado',
            render: (row) => <StatusBadge status={row.status} />,
          },
          { key: 'lots', header: 'Lotes', render: (row) => row.lots.length },
          {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
              <div className="flex flex-wrap gap-3">
                <Link href={`/admin/auctions/${row.id}/lots`} className="text-primary underline">
                  Ver lotes
                </Link>
                <Link
                  href={`/admin/auctions/${row.id}/bidders`}
                  className="text-primary underline"
                >
                  Postores
                </Link>
                <Link
                  href={`/admin/auctions/${row.id}/control`}
                  className="text-primary underline"
                >
                  Control
                </Link>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

