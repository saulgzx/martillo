'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [message, setMessage] = useState('');

  const onSave = () => {
    // TODO: connect to profile update endpoint when backend is available.
    setMessage('Guardado local. Endpoint de perfil pendiente en backend.');
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Email: <span className="font-medium">{user?.email ?? '--'}</span>
        </p>
      </header>

      <section className="space-y-4 rounded-lg border border-border p-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Nombre completo</label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Telefono</label>
          <input
            value={phone ?? ''}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <Button onClick={onSave}>Guardar cambios</Button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </section>

      <section className="space-y-2 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold">Aplicaciones activas</h2>
        <p className="text-sm text-muted-foreground">
          Vista de historial completa pendiente de integrar.
        </p>
      </section>
    </main>
  );
}
