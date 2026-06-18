/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cyan-forward brand (Data-Dense Dashboard palette) + green CTA
        brand: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        cta: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
      },
      fontFamily: {
        sans: ['"Fira Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.08)',
        soft: '0 4px 16px -2px rgb(15 23 42 / 0.08)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'carousel-out': {
          '0%':   { transform: 'translateX(0) scale(1)',      opacity: '1' },
          '100%': { transform: 'translateX(-6%) scale(0.97)', opacity: '0' },
        },
        'carousel-in': {
          '0%':   { transform: 'translateX(6%) scale(0.97)', opacity: '0' },
          '100%': { transform: 'translateX(0) scale(1)',     opacity: '1' },
        },
      },
      animation: {
        'fade-in':      'fade-in 200ms ease-out',
        'slide-in':     'slide-in 200ms ease-out',
        'toast-in':     'toast-in 200ms ease-out',
        'float':        'float 5s ease-in-out infinite',
        'float-slow':   'float 7s ease-in-out infinite',
        'slide-up':     'slide-up 500ms ease-out',
        'glow-pulse':   'glow-pulse 3s ease-in-out infinite',
        'carousel-out': 'carousel-out 550ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'carousel-in':  'carousel-in  550ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
};