import { InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { LuChevronDown } from "react-icons/lu";
import { inputClass } from "@shared/ui/form/Field";

// Kontrole forme. U React 19 `ref` je običan prop, pa rade i sa react-hook-form `register`.

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
  invalid?: boolean;
  /** Ikonica unutar polja, levo */
  leading?: ReactNode;
  /** Tekst ili ikonica unutar polja, desno (npr. "RSD") */
  trailing?: ReactNode;
}

const invalidClass = "border-error-400 focus:border-error-400 focus:ring-error-500/15 dark:border-error-500/60";

export function Input({ invalid, leading, trailing, className = "", ...rest }: InputProps) {
  const control = (
    <input
      aria-invalid={invalid || undefined}
      className={`${inputClass} ${invalid ? invalidClass : ""} ${leading ? "pl-9" : ""} ${trailing ? "pr-12" : ""} ${className}`}
      {...rest}
    />
  );
  if (!leading && !trailing) return control;
  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-gray-400">{leading}</span>
      )}
      {control}
      {trailing && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
          {trailing}
        </span>
      )}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: Ref<HTMLTextAreaElement>;
  invalid?: boolean;
}

export function Textarea({ invalid, className = "", rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={`${inputClass} h-auto py-2.5 leading-relaxed ${invalid ? invalidClass : ""} ${className}`}
      {...rest}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  ref?: Ref<HTMLSelectElement>;
  invalid?: boolean;
}

export function Select({ invalid, className = "", children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={`${inputClass} appearance-none pr-9 ${invalid ? invalidClass : ""} ${className}`}
        {...rest}
      >
        {children}
      </select>
      <LuChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
}

export function Checkbox({ label, description, id, className = "", ...rest }: CheckboxProps) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-start gap-2.5 ${className}`}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-brand-600 dark:border-gray-600"
        {...rest}
      />
      <span className="text-sm">
        <span className="text-gray-800 dark:text-gray-200">{label}</span>
        {description && <span className="block text-gray-500 dark:text-gray-400">{description}</span>}
      </span>
    </label>
  );
}
