import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell, ForgotPasswordForm, SupabaseConfigurationNotice } from "@/features/auth";
import { getCurrentUser } from "@/features/auth/server/session";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link for your Dawai account.",
};

export default async function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();
  const user = await getCurrentUser();

  if (user) {
    redirect(DEFAULT_AUTHENTICATED_PATH);
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      description="Enter the email you signed up with. We'll send a reset link if an account exists."
      footer={
        <p className="text-xs leading-relaxed text-ink-muted/70">
          For privacy, this page gives the same response whether or not an account exists.
        </p>
      }
    >
      {configured ? <ForgotPasswordForm /> : <SupabaseConfigurationNotice />}
    </AuthShell>
  );
}
