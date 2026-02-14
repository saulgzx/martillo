'use client';

import { Button } from '@/components/ui/button';

type Props = {
  open: boolean;
  url: string | null;
  onClose: () => void;
};

export function DocumentViewer({ open, url, onClose }: Props) {
  if (!open || !url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-lg bg-background p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Documento</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
        <iframe src={url} className="h-[70vh] w-full rounded-md border border-border" />
      </div>
    </div>
  );
}
