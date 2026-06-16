import type { ReactNode } from 'react';
import { IconAlert, IconBox, IconRefresh } from '@/components/icons';
import { Button } from './Button';

export function EmptyState({
  title,
  message,
  icon,
  action,
}: {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        {icon ?? <IconBox />}
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/60 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-500 shadow-sm">
        <IconAlert />
      </div>
      <p className="text-sm font-semibold text-red-700">No se pudo cargar</p>
      <p className="mt-1 max-w-md text-sm text-red-600">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" leftIcon={<IconRefresh className="h-4 w-4" />} onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
