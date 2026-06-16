import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Tabla con scroll horizontal en móvil y estilo consistente. */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="card-base overflow-hidden">
      <div className="overflow-x-auto">
        <table className={cn('w-full min-w-[640px] text-left text-sm', className)}>{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, className, align = 'left' }: { children?: ReactNode; className?: string; align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, align = 'left' }: { children?: ReactNode; className?: string; align?: 'left' | 'right' | 'center' }) {
  return (
    <td
      className={cn(
        'border-b border-slate-100 px-4 py-3 text-slate-700',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn('transition-colors hover:bg-slate-50/70', className)}>{children}</tr>;
}
