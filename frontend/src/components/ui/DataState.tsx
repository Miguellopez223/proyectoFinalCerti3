import type { ReactNode } from 'react';
import { ErrorState } from './States';

interface DataStateProps {
  loading: boolean;
  error: string | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingFallback: ReactNode;
  emptyFallback?: ReactNode;
  children: ReactNode;
}

/**
 * Envuelve los 3 estados de una vista: cargando, error y vacío.
 * Si todo está bien, renderiza children.
 */
export function DataState({
  loading,
  error,
  isEmpty,
  onRetry,
  loadingFallback,
  emptyFallback,
  children,
}: DataStateProps) {
  if (loading) return <>{loadingFallback}</>;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isEmpty && emptyFallback) return <>{emptyFallback}</>;
  return <>{children}</>;
}
