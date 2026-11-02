import type { Metadata } from "next";
import Link from "next/link";

import {
  AuthShell,
  FormMessage,
  ResetPasswordForm,
  SupabaseConfigurationNotice,
} from "@/features/auth";
import { getCurrentUser, getRecoveryAuthorization } from "@/features/auth/server/session";
import { Button } from "@/components/ui/button";
import {
  ACCOUNT_PASSWORD_PATH,
  DEFAULT_AUTHENTICATED_PATH,
  FORGOT_PASSWORD_PATH,
  SIGN_IN_PATH,
} from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your Dawai account.",
};

export default async function ResetPasswordPage() {
  const configured = isSupabaseConfigured();
  const recovery = await getRecoveryAuthorization();
  const user = recovery?.user ?? (await getCurrentUser());

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Reset links are single-use and expire. Completing a reset signs out every device, including this one."
      footer={
        <p className="text-xs leading-relaxed text-ink-muted/70">
          Use at least 8 characters. A memorable phrase is stronger than a short password with
          substitutions.
        </p>
      }
    >
      {!configured ? (
        <SupabaseConfigurationNotice />
      ) : recovery ? (
        <ResetPasswordForm />
      ) : user ? (
        <div className="space-y-5">
          <FormMessage tone="info">
            <p className="font-semibold">Open the reset link from your email.</p>
            <p className="mt-1">
              This page only accepts a session created by a password reset link. To change your
              password while signed in, use account settings and confirm your current password.
            </p>
          </FormMessage>

          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="w-full">
              <Link href={ACCOUNT_PASSWORD_PATH}>Change password in account settings</Link>
            </Button>
            <Link
              href={DEFAULT_AUTHENTICATED_PATH}
              className="inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold text-ink-muted transition-colors duration-200 hover:text-foreground"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <FormMessage tone="error">
            <p className="font-semibold">This reset link is invalid or has expired.</p>
            <p className="mt-1">
              Request a new link and open it in this browser. Links can only be used once.
            </p>
          </FormMessage>

          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="w-full">
              <Link href={FORGOT_PASSWORD_PATH}>Request a new reset link</Link>
            </Button>
            <Link
              href={SIGN_IN_PATH}
              className="inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold text-ink-muted transition-colors duration-200 hover:text-foreground"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
