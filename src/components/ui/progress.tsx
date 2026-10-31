import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type ProgressProps = Omit<ComponentProps<"div">, "children"> & {
  /** Progress percentage from 0 to 100. Values outside this range are clamped. */
  value: number;
  /** Accessible name, for example "Course progress". */
  label: string;
};

function Progress({ value, label, className, ...props }: ProgressProps) {
  const clamped = Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      data-slot="progress"
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated", className)}
      {...props}
    >
      <div
        aria-hidden="true"
        className="h-full rounded-full bg-progress transition-[width] duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };
