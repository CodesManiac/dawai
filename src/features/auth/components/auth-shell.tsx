import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

const sessionSteps = [
  {
    step: "01",
    title: "Bring a source",
    body: "A PDF, a recorded lecture, a chapter you barely survived.",
  },
  {
    step: "02",
    title: "Ask in your own words",
    body: "Answers stay anchored to the page, passage, or timestamp.",
  },
  {
    step: "03",
    title: "Make it stick",
    body: "Recall prompts and audio built from the same source.",
  },
] as const;

/**
 * Split-screen shell shared by every auth screen. The left column previews the
 * product direction; it is labeled as planned so it never implies shipped
 * functionality.
 */
function AuthShell({ eyebrow, title, description, children, footer, className }: AuthShellProps) {
  return (
    <div
      className={cn(
        "grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border-strong bg-surface/70 shadow-raised backdrop-blur-sm lg:grid-cols-[1.02fr_1fr]",
        className,
      )}
    >
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface p-10 lg:flex">
        <div aria-hidden="true" className="hero-glow absolute inset-0" />
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 opacity-70" />

        <div className="relative">
          <Badge variant="outline" className="border-progress/40 bg-progress/10">
            <span className="size-1.5 rounded-full bg-progress" aria-hidden="true" />
            Dawai account
          </Badge>

          <p className="mt-8 max-w-sm font-serif text-[1.75rem] leading-[1.3] font-medium tracking-[-0.01em] text-foreground">
            The goal isn&rsquo;t to finish the page. It&rsquo;s to still{" "}
            <span className="text-ink-muted italic">know it tomorrow.</span>
          </p>
        </div>

        <div className="relative mt-12">
          <p className="text-[0.625rem] font-bold tracking-[0.16em] text-ink-muted/70 uppercase">
            Planned learning flow
          </p>
          <ol className="mt-4 space-y-4">
            {sessionSteps.map((item) => (
              <li key={item.step} className="flex gap-3.5">
                <span
                  aria-hidden="true"
                  className="mt-0.5 font-mono text-[0.6875rem] font-bold tracking-[0.08em] text-ink-muted"
                >
                  {item.step}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted/80">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 border-t border-border pt-4 text-[0.6875rem] leading-relaxed text-ink-muted/60">
            These learning features are not built yet. Task 003 covers accounts, sessions, and the
            learning database foundation.
          </p>
        </div>
      </aside>

      <div className="p-6 sm:p-10">
        <p className="text-[0.625rem] font-bold tracking-[0.16em] text-ink-muted uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.035em] text-balance sm:text-[2rem]">
          {title}
        </h1>
        <div className="mt-3 text-sm leading-relaxed text-ink-muted">{description}</div>

        <div className="mt-7">{children}</div>

        {footer ? <div className="mt-7 border-t border-border pt-5">{footer}</div> : null}
      </div>
    </div>
  );
}

export { AuthShell };
