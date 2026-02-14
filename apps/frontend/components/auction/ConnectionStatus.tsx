'use client';

const stateConfig = {
  connected: { color: 'bg-green-500', label: 'Conectado' },
  connecting: { color: 'bg-yellow-500 animate-pulse', label: 'Conectando...' },
  reconnecting: { color: 'bg-yellow-500 animate-pulse', label: 'Reconectando...' },
  disconnected: { color: 'bg-red-500', label: 'Sin conexión' },
} as const;

type Props = {
  state: keyof typeof stateConfig;
  connectedCount?: number;
};

export function ConnectionStatus({ state, connectedCount }: Props) {
  const { color, label } = stateConfig[state];

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
      {connectedCount !== undefined && state === 'connected' && (
        <span className="text-xs text-muted-foreground">({connectedCount} online)</span>
      )}
    </div>
  );
}
