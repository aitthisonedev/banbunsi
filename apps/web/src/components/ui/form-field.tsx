import type { ReactNode } from "react";

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="form-field" htmlFor={htmlFor}>
      <span className="form-field-label">{label}</span>
      {children}
      {hint && !error ? <span className="form-field-hint">{hint}</span> : null}
      {error ? <span className="form-field-error">{error}</span> : null}
    </label>
  );
}
