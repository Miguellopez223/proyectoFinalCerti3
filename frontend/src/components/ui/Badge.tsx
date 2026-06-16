import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const tones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  success: 'bg-cta-50 text-cta-700 ring-cta-100',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Mapea estados de pedido a un tono de color. */
export function estadoPedidoTone(estado: string): Tone {
  switch (estado) {
    case 'PAGADO':
    case 'ENTREGADO':
      return 'success';
    case 'PENDIENTE':
      return 'warning';
    case 'PREPARANDO':
    case 'ENVIADO':
      return 'info';
    case 'CANCELADO':
      return 'danger';
    default:
      return 'neutral';
  }
}
