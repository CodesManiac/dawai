import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] leading-none font-bold tracking-[0.12em] uppercase",
  {
    variants: {
      variant: {
        default: "border-ai/40 bg-ai/15 text-foreground",
        solid: "border-transparent bg-ai text-foreground",
        progress: "border-progress/40 bg-progress/10 text-foreground",
        outline: "border-border-strong bg-transparent text-ink-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
