"use client";

import { cn } from "@/lib/cn";

interface BaseFieldProps {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

function FieldShell({
  label,
  name,
  error,
  hint,
  required,
  children,
}: BaseFieldProps & { children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
        {required && <span aria-hidden className="text-[color:var(--color-negative)]"> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-[color:var(--color-muted)]">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-[color:var(--color-negative)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  name,
  error,
  hint,
  required,
  ...rest
}: BaseFieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} name={name} error={error} hint={hint} required={required}>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        className={cn("input", error && "input-error")}
        {...rest}
      />
    </FieldShell>
  );
}

export function TextArea({
  label,
  name,
  error,
  hint,
  required,
  ...rest
}: BaseFieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} name={name} error={error} hint={hint} required={required}>
      <textarea
        id={name}
        name={name}
        rows={2}
        aria-invalid={!!error}
        className={cn("textarea", error && "input-error")}
        {...rest}
      />
    </FieldShell>
  );
}

export interface Option {
  value: string;
  label: string;
}

export function SelectField({
  label,
  name,
  error,
  hint,
  required,
  options,
  placeholder,
  ...rest
}: BaseFieldProps & {
  options: Option[];
  placeholder?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} name={name} error={error} hint={hint} required={required}>
      <select
        id={name}
        name={name}
        aria-invalid={!!error}
        className={cn("select", error && "input-error")}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
