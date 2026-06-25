import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Campos de formulario con la estética oscura de KLIKEA (vidrio sobre el lienzo
 * cálido). Misma API que `ui/Field` (label, error, hint, required) para que las
 * pantallas de auth se reescriban sin tocar la lógica. No reemplazan a `ui/Field`,
 * que sigue siendo claro para el panel admin.
 */

interface WrapperProps {
  label?: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

function AuthFieldWrapper({ label, error, hint, required, htmlFor, children, className }: WrapperProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#D7E2EA]/70">
          {label}
          {required && <span className="ml-0.5 text-[#e7a149]">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-300">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-white/40">{hint}</p>
      ) : null}
    </div>
  );
}

const fieldBase =
  'w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-slate-100 ' +
  'placeholder:text-white/30 transition-colors ' +
  'focus:border-[#e7a149]/60 focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-[#e7a149]/20 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const errorRing = 'border-rose-400/60 focus:border-rose-400 focus:ring-rose-500/25';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { label, error, hint, required, className, id, ...props },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <AuthFieldWrapper label={label} error={error} hint={hint} required={required} htmlFor={inputId}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={cn(fieldBase, error && errorRing, className)}
        {...props}
      />
    </AuthFieldWrapper>
  );
});

interface AuthSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const AuthSelect = forwardRef<HTMLSelectElement, AuthSelectProps>(function AuthSelect(
  { label, error, hint, required, className, id, children, ...props },
  ref,
) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <AuthFieldWrapper label={label} error={error} hint={hint} required={required} htmlFor={selectId}>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error}
        className={cn(
          fieldBase,
          'cursor-pointer appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10 [&>option]:bg-slate-900 [&>option]:text-slate-100',
          error && errorRing,
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23D7E2EA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
    </AuthFieldWrapper>
  );
});
