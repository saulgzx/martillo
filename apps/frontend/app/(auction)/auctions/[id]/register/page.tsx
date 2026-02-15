'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApplicationStepper } from '@/components/bidder/ApplicationStepper';
import { DocumentUploader } from '@/components/bidder/DocumentUploader';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api';

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export default function AuctionRegistrationPage() {
  const { id: auctionId } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function ensureUserLoaded() {
      if (user) return;
      setLoadingUser(true);
      try {
        await refreshToken();
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }

    void ensureUserLoaded();
    return () => {
      cancelled = true;
    };
  }, [refreshToken, user]);

  const apply = async () => {
    if (!user) {
      setLoading(true);
      try {
        const token = await refreshToken();
        if (!token) {
          router.push('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    }

    if (!acceptTerms) {
      setError('Debes aceptar términos para continuar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await withTimeout(
        apiClient.post(`/api/auctions/${auctionId}/register`),
        12_000,
        'Timeout al crear la solicitud. Reintenta.',
      );
      setStep(2);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;

      // If the user already applied, allow them to continue uploading documents.
      if (status === 409) {
        setStep(2);
        return;
      }

      if (status === 401) {
        setError('Tu sesión expiró. Inicia sesión nuevamente.');
        return;
      }

      setError('No se pudo crear la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocuments = async () => {
    if (!user?.id) {
      router.push('/login');
      return;
    }

    if (!identityFile) {
      setError('Debes subir documento de identidad');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const identityData = new FormData();
      identityData.append('auctionId', auctionId);
      identityData.append('type', 'IDENTITY');
      identityData.append('file', identityFile);
      await withTimeout(
        apiClient.post(`/api/users/${user.id}/documents`, identityData),
        20_000,
        'Timeout al subir documento de identidad. Reintenta.',
      );

      if (addressFile) {
        const addressData = new FormData();
        addressData.append('auctionId', auctionId);
        addressData.append('type', 'ADDRESS');
        addressData.append('file', addressFile);
        await withTimeout(
          apiClient.post(`/api/users/${user.id}/documents`, addressData),
          20_000,
          'Timeout al subir comprobante de domicilio. Reintenta.',
        );
      }

      setStep(3);
    } catch {
      setError('No se pudieron subir documentos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Registro de Postor</h1>
        <p className="text-sm text-muted-foreground">Remate: {auctionId}</p>
      </header>

      <ApplicationStepper step={step} />

      {error ? (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      {step === 1 ? (
        <section className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">Paso 1 - Datos y términos</h2>
          <div className="rounded-md bg-muted p-3 text-sm">
            <p>Nombre: {user?.fullName ?? '--'}</p>
            <p>Email: {user?.email ?? '--'}</p>
            <p>Teléfono: {user?.phone ?? '--'}</p>
          </div>

          {!user && !loadingUser ? (
            <div className="rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-900">
              Tu sesión no está disponible. Inicia sesión nuevamente para continuar.
              <div className="mt-2">
                <Button variant="outline" onClick={() => router.push('/login')}>
                  Ir a iniciar sesión
                </Button>
              </div>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Para solicitar cambios en tus datos, ve a{' '}
            <Link className="underline underline-offset-2" href="/profile">
              Mi cuenta
            </Link>
            . Los cambios deben ser aprobados por el administrador.
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
            />
            Acepto términos y condiciones del remate.
          </label>

          <Button onClick={apply} disabled={loading || loadingUser || !acceptTerms || !user}>
            {loading || loadingUser ? 'Cargando...' : 'Continuar'}
          </Button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-semibold">Paso 2 - Documentos</h2>
          <DocumentUploader
            label="Documento de identidad"
            required
            file={identityFile}
            onChange={setIdentityFile}
          />
          <DocumentUploader
            label="Comprobante de domicilio (opcional)"
            file={addressFile}
            onChange={setAddressFile}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
              Volver
            </Button>
            <Button onClick={uploadDocuments} disabled={loading}>
              {loading ? 'Subiendo...' : 'Enviar documentos'}
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <h2 className="text-sm font-semibold">Paso 3 - Confirmación</h2>
          <p className="text-sm">Tu solicitud fue enviada con estado: Pendiente de revisión.</p>
          <p className="text-sm">Tiempo estimado de aprobación: dentro de 24 horas.</p>
          <Button onClick={() => router.push(`/auctions/${auctionId}`)}>Volver al remate</Button>
        </section>
      ) : null}
    </main>
  );
}
