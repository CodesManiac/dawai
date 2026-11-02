import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell, FormMessage, SignInForm, SupabaseConfigurationNotice } from "@/features/auth";
import { getCurrentUser } from "@/features/auth/server/session";
import { sanitizeRedirectPath } from "@/lib/auth/redirects";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { firstSearchParam } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Dawai account.",
};

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function noticeFor(notice: string | undefined) {
  switch (notice) {
    case "signed-out":
      return { tone: "info" as const, text: "You're signed out. Sign in again to continue." };
    case "signed-out-partial":
      return {
        tone: "info" as const,
        text: "Sign-out may be incomplete because the auth service could not be reached. Sign in again and check other devices.",
      };
    case "password-updated":
      return {
        tone: "success" as const,
        text: "Password updated. Sign in with your new password.",
      };
    case "password-updated-partial":
      return {
        tone: "info" as const,
        text: "Password updated, but we couldn't confirm that every session was signed out. Sign in with your new password and check other devices.",
      };
    default:
      return null;
  }
}

function errorFor(error: string | undefined) {
  switch (error) {
    case "expired-link":
      return "That link has expired. Request a new confirmation or reset email.";
    case "invalid-link":
      return "That link is invalid or was already used. Request a new one.";
    case "auth-unavailable":
      return "Authentication is temporarily unavailable. Try again in a moment.";
    default:
      return null;
  }
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const next = sanitizeRedirectPath(firstSearchParam(params.next), DEFAULT_AUTHENTICATED_PATH);
  const configured = isSupabaseConfigured();
  const user = await getCurrentUser();

  if (user) {
    redirect(next);
  }

  const notice = noticeFor(firstSearchParam(params.notice));
  const error = errorFor(firstSearchParam(params.error));

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Dawai"
      description="Pick up where you left off. Protected pages validate your session on the server before anything renders."
      footer={
        <p className="text-xs leading-relaxed text-ink-muted/70">
          Trouble signing in? Check that you confirmed your email address, then try again.
        </p>
      }
    >
      {configured ? (
        <div className="space-y-5">
          {notice ? <FormMessage tone={notice.tone}>{notice.text}</FormMessage> : null}
          {error ? <FormMessage tone="error">{error}</FormMessage> : null}
          <SignInForm next={next} />
        </div>
      ) : (
        <SupabaseConfigurationNotice />
      )}
    </AuthShell>
  );
}
