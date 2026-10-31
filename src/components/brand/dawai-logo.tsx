import Link from "next/link";

import { cn } from "@/lib/utils";

type DawaiMarkProps = {
  className?: string;
};

/** The Dawai waveform mark. Decorative; pair it with an accessible brand name. */
function DawaiMark({ className }: DawaiMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "brand-mark grid size-9 shrink-0 place-items-center rounded-[0.7rem] text-foreground shadow-ai ring-1 ring-foreground/15",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5">
        <path
          d="M4.5 13.5v-3M8.25 16.5v-9M12 14.5v-5M15.75 18V6M19.5 13v-2"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

type DawaiLogoProps = {
  className?: string;
  markClassName?: string;
  href?: string;
};

function DawaiLogo({ className, markClassName, href = "/" }: DawaiLogoProps) {
  return (
    <Link
      href={href}
      aria-label="Dawai — home"
      className={cn("group inline-flex items-center gap-2.5 rounded-md text-foreground", className)}
    >
      <DawaiMark className={markClassName} />
      <span className="text-[1.15rem] leading-none font-extrabold tracking-[-0.03em]">Dawai</span>
    </Link>
  );
}

export { DawaiLogo, DawaiMark };
