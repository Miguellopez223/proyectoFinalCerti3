import { cn } from '@/lib/cn';

export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
      <svg
        className={cn('animate-spin text-brand-600', className ?? 'h-5 w-5')}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z" />
      </svg>
      {label ? <span className="text-sm text-slate-500">{label}</span> : <span className="sr-only">Cargando…</span>}
    </span>
  );
}

export function FullPageSpinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <Spinner className="h-8 w-8" label={label} />
    </div>
  );
}
