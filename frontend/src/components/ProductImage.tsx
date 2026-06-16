import { useState } from 'react';
import { cn } from '@/lib/cn';
import { IconImage } from '@/components/icons';

/** Imagen de producto con fallback cuando no hay URL o falla la carga. */
export function ProductImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div className={cn('flex items-center justify-center bg-slate-100 text-slate-300', className)}>
        <IconImage className="h-10 w-10" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
