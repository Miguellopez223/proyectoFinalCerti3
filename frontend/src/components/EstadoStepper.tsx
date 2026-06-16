import { cn } from '@/lib/cn';
import { IconCheck } from '@/components/icons';
import type { EstadoPedido } from '@/types';

// Flujo normal del pedido (CANCELADO se muestra aparte).
const FLOW: EstadoPedido[] = ['PENDIENTE', 'PAGADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO'];

export function EstadoStepper({ estado }: { estado: string }) {
  if (estado === 'CANCELADO') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Pedido cancelado
      </div>
    );
  }

  const currentIndex = FLOW.indexOf(estado as EstadoPedido);

  return (
    <ol className="flex items-center">
      {FLOW.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <li key={step} className={cn('flex items-center', i < FLOW.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  done && 'bg-cta-500 text-white',
                  current && 'bg-brand-600 text-white ring-4 ring-brand-100',
                  !done && !current && 'bg-slate-100 text-slate-400',
                )}
              >
                {done ? <IconCheck className="h-4 w-4" /> : i + 1}
              </span>
              <span className={cn('text-[11px] font-medium', current ? 'text-brand-700' : 'text-slate-400')}>
                {step}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <span className={cn('mx-1 h-0.5 flex-1 rounded', i < currentIndex ? 'bg-cta-500' : 'bg-slate-200')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
