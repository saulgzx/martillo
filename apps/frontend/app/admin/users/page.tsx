'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';

type UserRow = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  createdAt: string;
};

type ListResponse = {
  success: boolean;
  data: {
    total: number;
    page: number;
    data: UserRow[];
  };
};

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | UserRow['status']>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', '1');
    params.set('limit', '50');
    if (search.trim()) params.set('search', search.trim());
    if (status !== 'ALL') params.set('status', status);
    return params.toString();
  }, [search, status]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ListResponse>(`/api/admin/users?${query}`);
      setItems(res.data.data.data);
    } catch {
      setError('No se pudieron cargar usuarios.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function setUserStatus(userId: string, nextStatus: UserRow['status']) {
    const reason =
      nextStatus === 'BANNED'
        ? window.prompt('Motivo del baneo (opcional):') ?? undefined
        : undefined;
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/api/admin/users/${userId}/status`, { status: nextStatus, reason });
      await load();
    } catch {
      setError('No se pudo actualizar el estado del usuario.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Usuarios (postores)</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gestiona cuentas de usuarios finales: activar/desactivar/banear.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Buscar</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre o email"
              className="w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
              <option value="BANNED">Baneado</option>
            </select>
          </div>

          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No hay usuarios.</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Telefono</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Creado</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-3 font-medium text-foreground">{u.fullName}</td>
                    <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-3 py-3 text-muted-foreground">{u.phone ?? '-'}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                        {u.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {u.status !== 'BANNED' ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void setUserStatus(u.id, 'BANNED')}
                            disabled={loading}
                          >
                            Banear
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void setUserStatus(u.id, 'ACTIVE')}
                            disabled={loading}
                          >
                            Reactivar
                          </Button>
                        )}
                        {u.status !== 'INACTIVE' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void setUserStatus(u.id, 'INACTIVE')}
                            disabled={loading}
                          >
                            Desactivar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void setUserStatus(u.id, 'ACTIVE')}
                            disabled={loading}
                          >
                            Activar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

