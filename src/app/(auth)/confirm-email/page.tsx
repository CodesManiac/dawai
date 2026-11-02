import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  AuthShell,
  FormMessage,
  ResendConfirmationForm,
  SupabaseConfigurationNotice,
} from "@/features/auth";
import { getCurrentUser } from "@/features/auth/server/session";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Confirm your email",
  description: "Confirm your email address to activate your Dawai account.",
};

export default async function ConfirmEmailPage() {
  const configured = isSupabaseConfigured();
  const user = await getCurrentUser();

  if (user) {
    redirect(`${DEFAULT_AUTHENTICATED_PATH}?notice=welcome`);
  }

  return (
    <AuthShell
      eyebrow="Email confirmation"
      title="One link and you're in"
      description="Confirmation links are single-use. Open the link in the browser where you plan to use Dawai."
      footer={
        <p className="text-xs leading-relaxed text-ink-muted/70">
          If a link has expired, request a new one below. We&rsquo;ll only send a message if the
          address is waiting for confirmation.
        </p>
      }
    >
      {configured ? (
        <div className="space-y-5">
          <FormMessage tone="info">
            Already confirmed? Sign in instead — your account may be ready.
          </FormMessage>
          <ResendConfirmationForm />
        </div>
      ) : (
        <SupabaseConfigurationNotice />
      )}
    </AuthShell>
  );
}
