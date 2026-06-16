import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldWrapperProps {
  label?: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function FieldWrapper({ label, error, hint, required, htmlFor, children, className }: FieldWrapperProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label-base">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, required, className, id, ...props },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} htmlFor={inputId}>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={cn('input-base', error && 'border-red-400 focus:border-red-500 focus:ring-red-500/30', className)}
        {...props}
      />
    </FieldWrapper>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, required, className, id, children, ...props },
  ref,
) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} htmlFor={selectId}>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error}
        className={cn(
          'input-base cursor-pointer appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9',
          error && 'border-red-400 focus:border-red-500 focus:ring-red-500/30',
          className,
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, required, className, id, ...props },
  ref,
) {
  const generated = useId();
  const areaId = id ?? generated;
  return (
    <FieldWrapper label={label} error={error} hint={hint} required={required} htmlFor={areaId}>
      <textarea
        ref={ref}
        id={areaId}
        aria-invalid={!!error}
        className={cn('input-base min-h-[88px] resize-y', error && 'border-red-400 focus:ring-red-500/30', className)}
        {...props}
      />
    </FieldWrapper>
  );
});
