import { AudioLines, Check, FileText, MessagesSquare, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const followUps = [
  { label: "Listen", icon: AudioLines },
  { label: "Quiz me", icon: Check },
  { label: "Go deeper", icon: MessagesSquare },
] as const;

/**
 * Illustrative product preview. Everything here is static by design; the
 * caption makes clear that no learning feature is functional yet.
 */
function HeroStudyPanel() {
  return (
    <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div
        aria-hidden="true"
        className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-ai/15 blur-3xl"
      />

      <div className="overflow-hidden rounded-2xl border border-border-strong bg-surface/85 shadow-raised backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-1.5 rounded-full bg-ink-muted/30" />
            <span className="size-1.5 rounded-full bg-ink-muted/30" />
            <span className="size-1.5 rounded-full bg-ink-muted/30" />
          </div>
          <span className="text-[0.625rem] font-bold tracking-[0.16em] text-ink-muted/70 uppercase">
            Study room · concept
          </span>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <div className="rounded-xl border border-border bg-background/60 p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ai/15 text-foreground ring-1 ring-ai/30">
                <FileText className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-sm font-semibold">Cell Biology — Chapter 4</p>
                  <Badge variant="outline" className="shrink-0">
                    Sample
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-ink-muted">PDF · 28 pages</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={62} label="Sample source progress" />
              <span className="text-[0.625rem] font-semibold tracking-wider text-ink-muted">
                62%
              </span>
            </div>
          </div>

          <blockquote className="rounded-lg border-l-2 border-progress bg-progress/5 px-4 py-3">
            <p className="font-serif text-sm leading-relaxed text-ink-muted">
              &ldquo;ATP synthase converts the electrochemical gradient into mechanical rotation,
              driving the phosphorylation of ADP.&rdquo;
            </p>
            <cite className="mt-2 block text-[0.625rem] font-semibold tracking-[0.12em] text-ink-muted/70 uppercase not-italic">
              Source · p. 214
            </cite>
          </blockquote>

          <div className="rounded-xl border border-border bg-surface-elevated/60 p-4">
            <div className="flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-md bg-ai text-foreground">
                <Sparkles className="size-3" aria-hidden="true" />
              </span>
              <p className="text-[0.625rem] font-bold tracking-[0.14em] text-ink-muted uppercase">
                Dawai · grounded explanation
              </p>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">
              Think of ATP synthase as a turbine. The proton gradient is the water pressure; the
              enzyme&rsquo;s rotation is the wheel — and each turn builds ATP.
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-[0.625rem] text-ink-muted">
              <Check className="size-3 text-progress" aria-hidden="true" />
              Tied to one cited passage
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {followUps.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/50 px-3 py-1.5 text-[0.6875rem] font-semibold text-ink-muted"
              >
                <Icon className="size-3 text-ink-muted" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="mt-3 text-center text-xs text-ink-muted/70">
        Interface concept. Learning features are not live yet.
      </figcaption>
    </figure>
  );
}

export { HeroStudyPanel };
