import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-lg border border-border-strong bg-surface/60 px-3.5 text-sm text-foreground transition-colors duration-200",
        "placeholder:text-ink-muted/50 hover:border-ink-muted/40",
        "focus:border-progress focus:ring-2 focus:ring-progress/30 focus:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
