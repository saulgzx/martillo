import type { ReactNode } from 'react';

type Column<T> = {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
};

export function DataTable<T>({ columns, rows, rowKey }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-brand-blueLight/50 text-left">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-semibold text-foreground">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-t border-border">
              {columns.map((column) => (
                <td key={`${rowKey(row)}-${column.key}`} className="px-4 py-3 align-top">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
