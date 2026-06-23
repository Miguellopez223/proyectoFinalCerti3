import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  className?: string;
}

/**
 * Character-by-character scroll reveal. Each glyph eases from 0.2 → 1 opacity
 * as the paragraph travels through the viewport.
 */
export function AnimatedText({ text, className }: AnimatedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  });

  const words = text.split(' ');
  const total = text.length;
  let cursor = 0;

  return (
    <p ref={ref} className={className}>
      {words.map((word, wi) => {
        const chars = word.split('');
        const node = (
          <span key={wi} className="inline-block whitespace-nowrap">
            {chars.map((char, ci) => {
              const start = cursor / total;
              cursor += 1;
              const end = cursor / total;
              return (
                <Char key={ci} progress={scrollYProgress} range={[start, end]}>
                  {char}
                </Char>
              );
            })}
          </span>
        );
        cursor += 1; // account for the separating space
        return (
          <span key={`${wi}-w`}>
            {node}
            {wi < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </p>
  );
}

function Char({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <span className="relative">
      <span className="opacity-20">{children}</span>
      <motion.span style={{ opacity }} className="absolute left-0 top-0">
        {children}
      </motion.span>
    </span>
  );
}
