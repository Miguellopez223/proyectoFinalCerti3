import { Button } from './Button';
import { IconChevronLeft, IconChevronRight } from '@/components/icons';
import { cn } from '@/lib/cn';

interface PaginationProps {
  page: number; // 0-based
  totalPages: number;
  totalElements?: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalElements, onChange }: PaginationProps) {
  if (totalPages <= 1) {
    return totalElements != null ? (
      <p className="text-sm text-slate-500">{totalElements} resultado(s)</p>
    ) : null;
  }

  // Ventana de páginas alrededor de la actual.
  const pages: number[] = [];
  const start = Math.max(0, page - 2);
  const end = Math.min(totalPages - 1, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Página <span className="font-medium text-slate-700">{page + 1}</span> de {totalPages}
        {totalElements != null && <span className="text-slate-400"> · {totalElements} resultados</span>}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={page === 0}
          onClick={() => onChange(page - 1)}
          aria-label="Página anterior"
        >
          <IconChevronLeft className="h-4 w-4" />
        </Button>
        {start > 0 && <span className="px-1 text-slate-400">…</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'h-9 min-w-9 cursor-pointer rounded-lg px-3 text-sm font-medium transition-colors',
              p === page ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {p + 1}
          </button>
        ))}
        {end < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
          aria-label="Página siguiente"
        >
          <IconChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
