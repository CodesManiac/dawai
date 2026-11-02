import type { ComponentProps, ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { PasswordInput } from "@/features/auth/components/password-input";

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  type?: ComponentProps<"input">["type"];
  autoComplete?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  labelAddon?: ReactNode;
  autoFocus?: boolean;
  inputMode?: ComponentProps<"input">["inputMode"];
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
};

/**
 * Labeled text input. Errors are linked with `aria-describedby` and mark the
 * control invalid; the label stays visible at all times.
 */
function TextField({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  defaultValue,
  placeholder,
  required = false,
  hint,
  error,
  labelAddon,
  autoFocus,
  inputMode,
  minLength,
  maxLength,
  disabled,
  className,
}: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const isPassword = type === "password";

  const inputProps = {
    id,
    name,
    autoComplete,
    defaultValue,
    placeholder,
    required,
    autoFocus,
    inputMode,
    minLength,
    maxLength,
    disabled,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    className: undefined,
  } satisfies ComponentProps<"input">;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-foreground">
          {label}
        </label>
        {labelAddon}
      </div>

      {isPassword ? (
        <PasswordInput {...inputProps} type="password" />
      ) : (
        <Input {...inputProps} type={type} />
      )}

      {hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-ink-muted/70">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="text-xs leading-relaxed font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { TextField };
