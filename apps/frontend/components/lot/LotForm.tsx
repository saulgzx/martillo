'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/ui/ImageUploader';

type LotFormValues = {
  title: string;
  description: string;
  basePrice: string;
  minIncrement: string;
  category: string;
  files: File[];
};

type LotFormProps = {
  onSubmit?: (values: LotFormValues) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
};

export function LotForm({
  onSubmit,
  submitting = false,
  submitLabel = 'Guardar lote',
}: LotFormProps) {
  const [values, setValues] = useState<LotFormValues>({
    title: '',
    description: '',
    basePrice: '',
    minIncrement: '',
    category: '',
    files: [],
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit?.(values);
      }}
    >
      <input
        placeholder="Titulo del lote"
        className="w-full rounded-md border border-input px-3 py-2 text-sm"
        value={values.title}
        onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
      />
      <textarea
        placeholder="Descripcion"
        className="w-full rounded-md border border-input px-3 py-2 text-sm"
        value={values.description}
        onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input
          placeholder="Precio base"
          className="w-full rounded-md border border-input px-3 py-2 text-sm"
          value={values.basePrice}
          onChange={(event) => setValues((prev) => ({ ...prev, basePrice: event.target.value }))}
        />
        <input
          placeholder="Incremento minimo"
          className="w-full rounded-md border border-input px-3 py-2 text-sm"
          value={values.minIncrement}
          onChange={(event) => setValues((prev) => ({ ...prev, minIncrement: event.target.value }))}
        />
      </div>
      <input
        placeholder="Categoria"
        className="w-full rounded-md border border-input px-3 py-2 text-sm"
        value={values.category}
        onChange={(event) => setValues((prev) => ({ ...prev, category: event.target.value }))}
      />

      <ImageUploader
        onFilesChange={(files) => {
          setValues((prev) => ({ ...prev, files }));
        }}
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Guardando...' : submitLabel}
      </Button>
    </form>
  );
}
