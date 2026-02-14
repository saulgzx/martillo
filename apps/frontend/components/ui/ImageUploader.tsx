'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

type ImageUploaderProps = {
  maxFiles?: number;
  onFilesChange?: (files: File[]) => void;
};

export function ImageUploader({ maxFiles = 10, onFilesChange }: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);

  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  return (
    <div className="space-y-3">
      <input
        type="file"
        multiple
        accept="image/*,application/pdf"
        onChange={(event) => {
          const selected = Array.from(event.target.files ?? []).slice(0, maxFiles);
          setFiles(selected);
          onFilesChange?.(selected);
        }}
      />
      {previews.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {previews.map((preview) => (
            <div key={preview.name} className="rounded border border-border p-2">
              <Image
                src={preview.url}
                alt={preview.name}
                width={320}
                height={96}
                unoptimized
                className="h-24 w-full object-cover"
              />
              <p className="mt-1 truncate text-xs text-muted-foreground">{preview.name}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
