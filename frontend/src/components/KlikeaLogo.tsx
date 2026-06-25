import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

interface KlikeaLogoProps {
  className?: string;
  /** Recorta también la bolsa superior, dejando solo el wordmark KLIKEA + tagline. */
  noBag?: boolean;
}

/**
 * Cache de módulo: el PNG se procesa una sola vez por sesión (se le quita el
 * fondo oscuro dejando solo las letras sobre transparente).
 */
let cachedSrc: string | null = null;
let processing: Promise<string> | null = null;

/** Procesa el PNG: los píxeles oscuros (fondo) pasan a transparentes. */
function extraerLetras(): Promise<string> {
  if (cachedSrc) return Promise.resolve(cachedSrc);
  if (processing) return processing;
  processing = new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.src = '/logo-klikea.png';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('sin canvas 2d'));
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      // El fondo es casi negro y las letras (crema/naranja) son brillantes.
      // Opacidad rampada por el canal más alto: por debajo de LO transparente (corta
      // el fondo y el halo oscuro del borde), por encima de HI totalmente opaco. Sin
      // divisiones — así no se amplifica ruido ni aparecen motas en los bordes.
      const LO = 32;
      const HI = 88;
      for (let i = 0; i < d.length; i += 4) {
        const m = Math.max(d[i], d[i + 1], d[i + 2]);
        let a = (m - LO) / (HI - LO);
        a = a < 0 ? 0 : a > 1 ? 1 : a;
        d[i + 3] = Math.round(d[i + 3] * a);
      }
      ctx.putImageData(imgData, 0, 0);
      cachedSrc = canvas.toDataURL('image/png');
      resolve(cachedSrc);
    };
    img.onerror = () => reject(new Error('no se pudo cargar el logo'));
  });
  return processing;
}

/**
 * Logo de Klikea con el fondo del PNG removido (solo letras/tipografía sobre
 * transparente, fundido con el lienzo). Por defecto recorta los tres puntos
 * inferiores; con `noBag` recorta además la bolsa superior y deja solo el
 * wordmark KLIKEA + "TODO A UN CLICK". Pasá el ancho por `className`.
 */
export function KlikeaLogo({ className, noBag = false }: KlikeaLogoProps) {
  const [src, setSrc] = useState<string | null>(cachedSrc);

  useEffect(() => {
    let activo = true;
    extraerLetras()
      .then((s) => activo && setSrc(s))
      .catch(() => activo && setSrc('/logo-klikea.png')); // fallback al PNG original
    return () => {
      activo = false;
    };
  }, []);

  // noBag: solo el wordmark KLIKEA (recorta bolsa arriba, tagline y puntos abajo).
  // por defecto: bolsa + wordmark (recorta la tagline y los puntos de abajo).
  const aspectRatio = noBag ? '1193 / 215' : '1193 / 470';
  const objectPosition = noBag ? '50% 47%' : '50% 0%';

  return (
    <div className={cn('overflow-hidden', className)} style={{ aspectRatio }}>
      {src && (
        <img
          src={src}
          alt="Klikea"
          className="h-full w-full object-cover"
          style={{ objectPosition }}
        />
      )}
    </div>
  );
}
