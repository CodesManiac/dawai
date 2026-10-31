import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-semibold tracking-[0.01em] whitespace-nowrap transition-[background-color,border-color,color,opacity,transform] duration-200 disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ai text-foreground shadow-ai hover:bg-ai/90 active:translate-y-px",
        secondary:
          "border border-border-strong bg-surface-elevated text-foreground hover:bg-surface-elevated/80",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:border-ink-muted/50 hover:bg-foreground/5",
        ghost: "text-ink-muted hover:bg-foreground/5 hover:text-foreground",
        link: "text-ink-muted underline-offset-4 hover:text-foreground hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (for example a Next.js Link) with button styles. */
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
