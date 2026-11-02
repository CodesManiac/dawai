import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FormMessageProps = {
  tone: "error" | "success" | "info";
  children: ReactNode;
  className?: string;
};

const toneStyles = {
  error: "border-danger/40 bg-danger/10 text-danger",
  success: "border-progress/40 bg-progress/10 text-foreground",
  info: "border-border-strong bg-surface-elevated/50 text-ink-muted",
} as const;

const toneIcons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
} as const;

/** Inline status block. Errors are announced assertively; successes politely. */
function FormMessage({ tone, children, className }: FormMessageProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed",
        toneStyles[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export { FormMessage };
