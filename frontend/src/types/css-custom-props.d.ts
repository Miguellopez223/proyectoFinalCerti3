// Module augmentation — the import makes this a module file so the
// declaration *extends* React instead of replacing it.
import 'react';

declare module 'react' {
  interface CSSProperties {
    // Allow CSS custom properties (e.g. --reveal-delay) in inline styles
    [key: `--${string}`]: string | number | undefined;
  }
}
