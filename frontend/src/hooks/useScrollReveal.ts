import { useEffect, useRef, useState } from 'react';

/**
 * Fires `revealed = true` the first time the element enters the viewport.
 * Observer is disconnected after first intersection so state is permanent.
 */
export function useScrollReveal(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -30px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, revealed };
}
