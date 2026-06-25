import { motion, type HTMLMotionProps } from 'framer-motion';
import { useMemo, type ElementType, type ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  /** Delay before the reveal starts (seconds). */
  delay?: number;
  /** Animation duration (seconds). */
  duration?: number;
  /** Horizontal travel distance (px). */
  x?: number;
  /** Vertical travel distance (px). */
  y?: number;
  /** Element type to render — defaults to a div. */
  as?: ElementType;
  className?: string;
  style?: HTMLMotionProps<'div'>['style'];
}

const EASE = [0.25, 0.1, 0.25, 1] as const;

/**
 * Scroll-triggered reveal: fades + slides its children into place the first
 * time they enter the viewport. Mirrors the portfolio FadeIn primitive.
 */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  as = 'div',
  className,
  style,
}: FadeInProps) {
  // Memoizado por `as`: sin esto, cada render crea un componente nuevo y React
  // desmonta/remonta el subárbol (en un form, perdés el foco al escribir).
  const MotionTag = useMemo(() => motion.create(as as ElementType), [as]);

  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}
