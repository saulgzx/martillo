'use client';

type Props = {
  step: 1 | 2 | 3;
};

const STEPS = [
  { id: 1, label: 'Datos' },
  { id: 2, label: 'Documentos' },
  { id: 3, label: 'Confirmacion' },
] as const;

export function ApplicationStepper({ step }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {STEPS.map((item) => {
        const active = item.id === step;
        const completed = item.id < step;
        return (
          <div
            key={item.id}
            className={`rounded-md px-3 py-2 text-center text-xs font-semibold ${
              completed
                ? 'bg-emerald-100 text-emerald-700'
                : active
                  ? 'bg-brand-navy text-white'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {item.id}. {item.label}
          </div>
        );
      })}
    </div>
  );
}
