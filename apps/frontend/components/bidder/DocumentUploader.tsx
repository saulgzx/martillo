'use client';

import { useMemo } from 'react';

type Props = {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  required?: boolean;
};

export function DocumentUploader({ label, file, onChange, required }: Props) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </label>
      <input
        type="file"
        accept="image/*,application/pdf"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      {file ? (
        <p className="text-xs text-muted-foreground">Archivo: {file.name}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Sin archivo seleccionado</p>
      )}
      {previewUrl && file?.type.startsWith('image/') ? (
        <img
          src={previewUrl}
          alt="Vista previa de documento"
          className="h-28 w-full rounded-md border border-border object-cover"
        />
      ) : null}
    </div>
  );
}
