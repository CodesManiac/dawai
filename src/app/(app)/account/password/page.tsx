import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm, FormMessage } from "@/features/auth";
import { requireUser } from "@/features/auth/server/session";
import { ACCOUNT_PASSWORD_PATH, DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/routes";
import { firstSearchParam } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Change password",
  description: "Change the password for your Dawai account.",
};

type AccountPasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function noticeFor(notice: string | undefined) {
  switch (notice) {
    case "password-changed":
      return {
        tone: "success" as const,
        text: "Password updated. Other devices using the old password have been signed out.",
      };
    case "password-changed-partial":
      return {
        tone: "info" as const,
        text: "Password updated, but we couldn't confirm that other sessions were signed out. Sign out of any other devices manually.",
      };
    default:
      return null;
  }
}

export default async function AccountPasswordPage({ searchParams }: AccountPasswordPageProps) {
  const params = await searchParams;
  const notice = noticeFor(firstSearchParam(params.notice));
  const user = await requireUser(ACCOUNT_PASSWORD_PATH);

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Link
        href={DEFAULT_AUTHENTICATED_PATH}
        className="inline-flex items-center gap-1.5 rounded-md text-xs font-semibold text-ink-muted transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to dashboard
      </Link>

      <p className="mt-8 text-[0.6875rem] font-bold tracking-[0.16em] text-progress uppercase">
        Account security
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-balance sm:text-4xl">
        Change your password
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
        Confirm your current password before choosing a new one. This is different from a password
        reset email, which is only required when you cannot sign in.
      </p>

      {notice ? (
        <div className="mt-6">
          <FormMessage tone={notice.tone}>{notice.text}</FormMessage>
        </div>
      ) : null}

      <Card className="mt-6 bg-surface/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-progress" aria-hidden="true" />
            Password
          </CardTitle>
          <CardDescription>
            Signed in as{" "}
            <span className="font-medium text-foreground">{user.email ?? "your account"}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </section>
  );
}
