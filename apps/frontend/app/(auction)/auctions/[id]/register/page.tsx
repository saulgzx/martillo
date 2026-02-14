'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApplicationStepper } from '@/components/bidder/ApplicationStepper';
import { DocumentUploader } from '@/components/bidder/DocumentUploader';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/api';

export default function AuctionRegistrationPage() {
  const { id: auctionId } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    if (!acceptTerms) {
      setError('Debes aceptar terminos para continuar');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/api/auctions/${auctionId}/register`);
      setStep(2);
    } catch {
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
      await apiClient.post(`/api/users/${user.id}/documents`, identityData);

      if (addressFile) {
        const addressData = new FormData();
        addressData.append('auctionId', auctionId);
        addressData.append('type', 'ADDRESS');
        addressData.append('file', addressFile);
        await apiClient.post(`/api/users/${user.id}/documents`, addressData);
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
          <h2 className="text-sm font-semibold">Paso 1 - Datos y terminos</h2>
          <div className="rounded-md bg-muted p-3 text-sm">
            <p>Nombre: {user?.fullName ?? '--'}</p>
            <p>Email: {user?.email ?? '--'}</p>
            <p>Telefono: {user?.phone ?? '--'}</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
            />
            Acepto terminos y condiciones del remate.
          </label>
          <Button onClick={apply} disabled={loading}>
            {loading ? 'Enviando...' : 'Continuar'}
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
          <h2 className="text-sm font-semibold">Paso 3 - Confirmacion</h2>
          <p className="text-sm">Tu solicitud fue enviada con estado: Pendiente de revision.</p>
          <p className="text-sm">Tiempo estimado de aprobacion: dentro de 24 horas.</p>
          <Button onClick={() => router.push(`/auctions/${auctionId}`)}>Volver al remate</Button>
        </section>
      ) : null}
    </main>
  );
}
