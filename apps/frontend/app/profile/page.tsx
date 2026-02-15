'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { AppTopbar } from '@/components/common/AppTopbar';
import type { CreateProfileChangeRequest, ProfileChangeRequest } from '@martillo/shared';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [pending, setPending] = useState<ProfileChangeRequest | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      void refreshToken();
    }
  }, [refreshToken, user]);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName ?? '');
    setEmail(user.email ?? '');
    setPhone(user.phone ?? '');
  }, [user]);

  async function loadPending() {
    try {
      const res = await apiClient.get<{ success: boolean; data: ProfileChangeRequest | null }>(
        '/api/profile/change-requests/me',
      );
      setPending(res.data.data ?? null);
    } catch {
      setPending(null);
    }
  }

  useEffect(() => {
    void loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPending = Boolean(pending && pending.status === 'PENDING');
  const changes = useMemo(() => {
    if (!user) return null;
    return {
      fullName: fullName.trim() !== user.fullName ? fullName.trim() : undefined,
      email: email.trim() !== user.email ? email.trim() : undefined,
      phone: phone.trim() !== (user.phone ?? '') ? phone.trim() : undefined,
    } satisfies CreateProfileChangeRequest;
  }, [email, fullName, phone, user]);

  const canSubmit = Boolean(
    user && !hasPending && (changes?.email || changes?.fullName || changes?.phone),
  );

  const onSubmit = async () => {
    if (!canSubmit || !changes) return;
    setLoading(true);
    setMessage(null);
    try {
      await apiClient.post('/api/profile/change-requests', changes);
      await loadPending();
      setMessage('Solicitud enviada. Queda pendiente de aprobacion por el administrador.');
    } catch {
      setMessage('No se pudo enviar la solicitud. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <AppTopbar />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Mi Cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Estos cambios se envian como solicitud y deben ser aprobados por un administrador.
        </p>
      </header>

      <section className="max-w-xl space-y-4 rounded-lg border border-border bg-background p-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Nombre completo</label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={!user || hasPending}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={!user || hasPending}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Telefono</label>
          <input
            value={phone ?? ''}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={!user || hasPending}
          />
        </div>
        <Button onClick={onSubmit} disabled={!canSubmit || loading}>
          {loading ? 'Enviando...' : 'Solicitar cambios'}
        </Button>
        {hasPending ? (
          <p className="text-sm text-muted-foreground">
            Tienes una solicitud pendiente. No puedes enviar otra hasta que sea aprobada o
            rechazada.
          </p>
        ) : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </section>
    </main>
  );
}
