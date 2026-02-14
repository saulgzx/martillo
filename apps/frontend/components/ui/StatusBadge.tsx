import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  status: string;
};

const statusColorMap: Record<string, string> = {
  LIVE: 'bg-brand-blue text-white',
  PUBLISHED: 'bg-brand-blueLight text-brand-text',
  DRAFT: 'bg-muted text-muted-foreground',
  ACTIVE: 'bg-green-100 text-green-800',
  ADJUDICATED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        statusColorMap[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {status}
    </span>
  );
}
