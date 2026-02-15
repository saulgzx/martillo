'use client';

import { Button } from '@/components/ui/button';

type DocumentItem = {
  previewUrl: string;
  downloadUrl: string;
  mimeType?: string | null;
  originalName?: string | null;
};

type Props = {
  open: boolean;
  document: DocumentItem | null;
  onClose: () => void;
};

export function DocumentViewer({ open, document, onClose }: Props) {
  if (!open || !document) return null;

  const isPdf = document.mimeType === 'application/pdf';
  const title = document.originalName?.trim() ? document.originalName : 'Documento';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={document.downloadUrl} target="_blank" rel="noreferrer">
                Descargar
              </a>
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
        {isPdf ? (
          <iframe
            src={document.previewUrl}
            className="h-[70vh] w-full rounded-md border border-border"
            title={title}
          />
        ) : (
          <div className="flex h-[70vh] w-full items-center justify-center rounded-md border border-border bg-muted/30 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={document.previewUrl}
              alt={title}
              className="max-h-full max-w-full rounded-md object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}
