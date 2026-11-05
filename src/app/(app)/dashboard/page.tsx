import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Fingerprint, KeyRound, Mail, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/features/auth";
import { requireUser } from "@/features/auth/server/session";
import { ACCOUNT_PASSWORD_PATH } from "@/lib/auth/routes";
import { firstSearchParam } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Dawai account overview.",
};

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const nextSteps = [
  {
    title: "Study packs",
    body: "Group sources into a focused pack and keep the questions that came out of it.",
  },
  {
    title: "Source ingestion",
    body: "Upload a document or paste a URL, then ask questions anchored to page and timestamp.",
  },
  {
    title: "Audio lessons",
    body: "Turn a source into a listenable lesson without losing the underlying citations.",
  },
] as const;

function displayNameFor(name: string | undefined, email: string | undefined): string {
  if (name && name.trim().length > 0) {
    return name.trim().slice(0, 60);
  }

  if (email) {
    return email.split("@")[0];
  }

  return "there";
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const notice = firstSearchParam(params.notice);
  const user = await requireUser("/dashboard");
  const fullName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined;

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border">
        <div aria-hidden="true" className="hero-glow absolute inset-0 -z-20" />
        <div aria-hidden="true" className="blueprint-grid absolute inset-0 -z-10 opacity-60" />

        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <Badge variant="progress">
            <ShieldCheck aria-hidden="true" className="size-3" />
            Session verified on the server
          </Badge>

          <h1 className="mt-5 max-w-2xl text-3xl leading-[1.08] font-extrabold tracking-[-0.045em] text-balance sm:text-4xl lg:text-5xl">
            Welcome back, {displayNameFor(fullName, user.email)}.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            Your account is live. Authentication and the learning database foundation are in place;
            the learning workspace comes later.
          </p>

          <div className="mt-6 max-w-xl space-y-3">
            {notice === "welcome" ? (
              <FormMessage tone="success">
                Your account is confirmed. This is your authenticated home.
              </FormMessage>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="bg-surface/60">
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                The identity Supabase Auth verified for this request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                <div className="flex items-start gap-3 py-3 first:pt-0">
                  <Mail className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <div className="min-w-0">
                    <dt className="text-[0.625rem] font-bold tracking-[0.14em] text-ink-muted/70 uppercase">
                      Email
                    </dt>
                    <dd className="mt-1 truncate text-sm font-medium text-foreground">
                      {user.email ?? "Not available"}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-3">
                  <Fingerprint
                    className="mt-0.5 size-4 shrink-0 text-ink-muted"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-[0.625rem] font-bold tracking-[0.14em] text-ink-muted/70 uppercase">
                      Sign-in method
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">Email and password</dd>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-3 last:pb-0">
                  <CalendarDays
                    className="mt-0.5 size-4 shrink-0 text-ink-muted"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-[0.625rem] font-bold tracking-[0.14em] text-ink-muted/70 uppercase">
                      Account created
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      {formatDate(user.created_at)}
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="mt-4 border-t border-border pt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href={ACCOUNT_PASSWORD_PATH}>
                    <KeyRound aria-hidden="true" />
                    Change password
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface/40">
            <CardHeader>
              <CardTitle>How this session stays valid</CardTitle>
              <CardDescription>No client-side-only guard is trusted.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "The Next.js proxy refreshes expired Supabase tokens and writes updated cookies.",
                  "Every protected layout re-checks the identity with Supabase Auth on the server.",
                  "Signing out clears the session cookies and redirects to sign-in.",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
                    <ShieldCheck
                      className="mt-0.5 size-4 shrink-0 text-progress"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10">
          <div className="max-w-2xl">
            <p className="text-[0.6875rem] font-bold tracking-[0.16em] text-progress uppercase">
              On the roadmap
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-balance">
              What this account will unlock.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              These are planned capabilities, not shipped features. Each one requires its own
              approved task.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {nextSteps.map((item) => (
              <Card key={item.title} className="border-dashed bg-transparent shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-ink-muted">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
