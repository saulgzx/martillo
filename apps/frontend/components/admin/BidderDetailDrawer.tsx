'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { DocumentViewer } from './DocumentViewer';

type DocumentItem = {
  id: string;
  type: 'IDENTITY' | 'ADDRESS';
  uploadedAt: string;
  url: string;
};

type BidderRow = {
  id: string;
  status: string;
  paddleNumber: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    rutMasked?: string;
    phone?: string | null;
  };
};

type Props = {
  open: boolean;
  auctionId: string;
  bidder: BidderRow | null;
  onClose: () => void;
  onActionDone: () => void;
};

export function BidderDetailDrawer({ open, auctionId, bidder, onClose, onActionDone }: Props) {
  const [reason, setReason] = useState('');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !bidder) return;
    setLoading(true);
    apiClient
      .get<{ success: boolean; data: DocumentItem[] }>(
        `/api/users/${bidder.user.id}/documents?auctionId=${auctionId}`,
      )
      .then((response) => setDocuments(response.data.data))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [open, bidder, auctionId]);

  if (!open || !bidder) return null;

  const runAction = async (action: 'approve' | 'reject' | 'ban') => {
    const url = `/api/bidders/${bidder.id}/${action}`;
    const payload = action === 'approve' ? undefined : { reason: reason || 'No especificado' };
    await apiClient.post(url, payload);
    onActionDone();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md space-y-4 overflow-y-auto bg-background p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Detalle Postor</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        <div className="space-y-1 text-sm">
          <p className="font-medium">{bidder.user.fullName}</p>
          <p>{bidder.user.email}</p>
          <p>RUT: {bidder.user.rutMasked ?? '--'}</p>
          <p>Paleta: #{bidder.paddleNumber}</p>
          <p>Estado: {bidder.status}</p>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Documentos</h4>
          {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> : null}
          {!loading && documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin documentos</p>
          ) : null}
          {documents.map((document) => (
            <button
              key={document.id}
              className="w-full rounded-md border border-border px-3 py-2 text-left text-sm"
              onClick={() => setViewerUrl(document.url)}
            >
              {document.type} - {new Date(document.uploadedAt).toLocaleString('es-CL')}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Motivo (rechazar/banear)</label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => runAction('approve')}
          >
            Aprobar
          </Button>
          <Button size="sm" variant="outline" onClick={() => runAction('reject')}>
            Rechazar
          </Button>
          <Button size="sm" variant="destructive" onClick={() => runAction('ban')}>
            Banear
          </Button>
        </div>
      </aside>

      <DocumentViewer
        open={Boolean(viewerUrl)}
        url={viewerUrl}
        onClose={() => setViewerUrl(null)}
      />
    </>
  );
}
