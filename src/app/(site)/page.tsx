import {
  ArrowRight,
  Check,
  Circle,
  FileSearch,
  Headphones,
  ShieldCheck,
  Target,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ArchitectureMap } from "./_components/architecture-map";
import { HeroStudyPanel } from "./_components/hero-study-panel";

const principles = [
  {
    title: "Source-grounded",
    body: "Explanations anchor to the exact page, passage, or timestamp — never an unsourced guess.",
    icon: FileSearch,
  },
  {
    title: "Learn your way",
    body: "Read, listen, or ask. One source opens several paths to the same idea.",
    icon: Headphones,
  },
  {
    title: "Practice that sticks",
    body: "Retrieval, quizzes, and feedback designed around recall — not streak mechanics.",
    icon: Target,
  },
  {
    title: "Privacy by default",
    body: "Learning data is treated as personal from the first schema decision, not patched in later.",
    icon: ShieldCheck,
  },
] as const;

const ready = [
  "Email/password auth with server-validated sessions",
  "Next.js App Router shell with strict TypeScript",
  "Semantic design tokens and accessible UI primitives",
  "Montserrat UI with Source Serif 4 for learning content",
  "Vitest, Testing Library, and Playwright smoke tests",
  "ESLint, Prettier, and architecture import boundaries",
  "Environment template and documented conventions",
] as const;

const deferred = [
  "Study packs and the learning database schema",
  "AI provider adapter and live model calls",
  "Document upload, parsing, embeddings, and retrieval",
  "Audio lessons, quizzes, tutoring, and TTS",
] as const;

const heroFacts = [
  { label: "Framework", value: "Next.js 16" },
  { label: "Language", value: "TypeScript 5.9" },
  { label: "Styling", value: "Tailwind CSS 4" },
] as const;

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border">
        <div aria-hidden="true" className="hero-glow absolute inset-0 -z-20" />
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 -z-10" />

        <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-8 lg:py-24">
          <div>
            <Badge variant="outline" className="border-progress/40 bg-progress/10">
              <span className="size-1.5 rounded-full bg-progress" aria-hidden="true" />
              Auth foundation · Task 002
            </Badge>

            <h1 className="mt-6 max-w-2xl text-4xl leading-[1.02] font-extrabold tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
              Turn any source into{" "}
              <span className="font-serif font-medium tracking-[-0.02em] text-ink-muted italic">
                understanding.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Dawai is an AI learning companion for documents, webpages, and educational video. Ask
              grounded questions, listen to lessons, and practice until ideas stick.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/design-system">
                  Explore the design system
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#architecture">See the architecture</Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6">
              {heroFacts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-[0.625rem] font-bold tracking-[0.14em] text-ink-muted/70 uppercase">
                    {fact.label}
                  </dt>
                  <dd className="mt-1.5 text-sm font-semibold text-foreground">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <HeroStudyPanel />
        </div>
      </section>

      <section className="border-b border-border py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-progress uppercase">
              Product direction
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
              Learning that respects the source — and the learner.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Dawai is being designed around four principles. They shape the architecture now and
              the product later.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ title, body, icon: Icon }) => (
              <Card key={title} className="h-full bg-surface/50">
                <CardHeader>
                  <span className="mb-3 grid size-10 place-items-center rounded-lg bg-ai/15 text-foreground ring-1 ring-ai/30">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-ink-muted">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-5 text-xs text-ink-muted/70">
            Accounts and sessions are implemented. The learning features above remain planned.
          </p>
        </div>
      </section>

      <section
        id="architecture"
        className="scroll-mt-20 border-b border-border bg-surface/20 py-20 sm:py-24"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8">
          <div>
            <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-progress uppercase">
              Architecture
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
              Clear boundaries before clever features.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Dawai will combine auth, storage, retrieval, AI, and media. Those concerns fail loudly
              when they leak into components, so the foundation separates them now.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "UI consumes props and server actions — never database clients.",
                "AI providers sit behind contracts, so models and vendors can change.",
                "Document processing owns parsing and citations; routes stay thin.",
                "Shared code stays pure; server capabilities never import React.",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
                  <Check className="mt-0.5 size-4 shrink-0 text-progress" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-8 text-xs leading-relaxed text-ink-muted/70">
              Auth is implemented. The AI and document modules are still contracts only.
            </p>
          </div>

          <ArchitectureMap />
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-progress uppercase">
              Task 002 status
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl">
              Authentication is in place. The product isn&rsquo;t.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              You can create an account, sign in, recover a password, and hold a server-validated
              session. Study packs, sources, AI, and audio are deliberately absent.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <Card className="bg-surface/50">
              <CardHeader className="flex-row items-center justify-between gap-4">
                <CardTitle>Ready in this task</CardTitle>
                <Badge variant="progress">Ready</Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {ready.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
                      <Check className="mt-0.5 size-4 shrink-0 text-progress" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-dashed bg-transparent shadow-none">
              <CardHeader className="flex-row items-center justify-between gap-4">
                <CardTitle>Deliberately deferred</CardTitle>
                <Badge variant="outline">Awaiting approval</Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {deferred.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
                      <Circle
                        className="mt-0.5 size-4 shrink-0 text-ink-muted/50"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 rounded-2xl border border-border-strong bg-surface/60 p-6 shadow-raised sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-progress uppercase">
                  Review first
                </p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">
                  Task 003 starts only after approval.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                  Authentication is reviewable now. Study packs, ingestion, and AI remain out of
                  scope until the next task is approved.
                </p>
              </div>
              <Button asChild variant="secondary" className="shrink-0">
                <Link href="/sign-up">
                  Create an account
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
