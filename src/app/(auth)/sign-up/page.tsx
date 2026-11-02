import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell, SignUpForm, SupabaseConfigurationNotice } from "@/features/auth";
import { getCurrentUser } from "@/features/auth/server/session";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Dawai account with your email address.",
};

export default async function SignUpPage() {
  const configured = isSupabaseConfigured();
  const user = await getCurrentUser();

  if (user) {
    redirect(DEFAULT_AUTHENTICATED_PATH);
  }

  return (
    <AuthShell
      eyebrow="Start here"
      title="Create your Dawai account"
      description="One email, one password, and a place for the ideas you want to keep."
      footer={
        <p className="text-xs leading-relaxed text-ink-muted/70">
          Email confirmation is required. You&rsquo;ll receive one link; open it in this browser to
          activate your account.
        </p>
      }
    >
      {configured ? <SignUpForm /> : <SupabaseConfigurationNotice />}
    </AuthShell>
  );
}
