"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";

import { sanitizeRedirectPath } from "@/lib/auth/redirects";
import {
  ACCOUNT_PASSWORD_PATH,
  AUTH_CALLBACK_PATH,
  DEFAULT_AUTHENTICATED_PATH,
  RESET_PASSWORD_PATH,
  SIGN_IN_PATH,
} from "@/lib/auth/routes";
import { getAppUrl } from "@/lib/env";
import { getSupabaseConfigurationHelp, isSupabaseConfigured } from "@/lib/supabase/config";
import { clearSupabaseAuthCookies, createSupabaseServerClient } from "@/server/supabase/server";

import { isRateLimitError, mapAuthError } from "@/features/auth/lib/errors";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendConfirmationSchema,
  signInSchema,
  signUpSchema,
  toFieldErrors,
} from "@/features/auth/schemas/auth";
import { getCurrentUser, getRecoveryAuthorization } from "@/features/auth/server/session";
import type { AuthActionState } from "@/features/auth/types";

function readField(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

function configErrorState(): AuthActionState {
  return { status: "error", message: getSupabaseConfigurationHelp() };
}

function validationErrorState(error: z.ZodError): AuthActionState {
  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors: toFieldErrors(error),
  };
}

/** Email links must land on our own callback, never an arbitrary host. */
function buildCallbackUrl(nextPath: string): string {
  const url = new URL(AUTH_CALLBACK_PATH, getAppUrl());
  url.searchParams.set("next", nextPath);
  return url.toString();
}

function signUpOptions(fullName?: string) {
  return {
    emailRedirectTo: buildCallbackUrl(DEFAULT_AUTHENTICATED_PATH),
    ...(fullName ? { data: { full_name: fullName } } : {}),
  };
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: readField(formData, "email"),
    password: readField(formData, "password"),
  });
  const nextPath = sanitizeRedirectPath(readField(formData, "next"));

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  if (!isSupabaseConfigured()) {
    return configErrorState();
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { status: "error", message: mapAuthError(error, "signIn") };
  }

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: readField(formData, "fullName"),
    email: readField(formData, "email"),
    password: readField(formData, "password"),
    confirmPassword: readField(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  if (!isSupabaseConfigured()) {
    return configErrorState();
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: signUpOptions(fullName),
  });

  if (error) {
    return { status: "error", message: mapAuthError(error, "signUp") };
  }

  revalidatePath("/", "layout");

  // Confirmation disabled: Supabase returns a session immediately.
  if (data.session) {
    redirect(`${DEFAULT_AUTHENTICATED_PATH}?notice=welcome`);
  }

  return {
    status: "success",
    message:
      "Check your inbox to confirm your email address. If you don't see it in a minute, look in spam before requesting another link.",
    submittedEmail: email,
  };
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: readField(formData, "email") });

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  if (!isSupabaseConfigured()) {
    return configErrorState();
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: buildCallbackUrl(RESET_PASSWORD_PATH),
  });

  // Rate limits are safe to surface and are actionable. Other failures stay
  // generic so the form never reveals whether an account exists.
  if (error && isRateLimitError(error)) {
    return { status: "error", message: mapAuthError(error, "forgotPassword") };
  }

  return {
    status: "success",
    message:
      "If an account exists for that email, a password reset link is on its way. The link can only be used once.",
  };
}

export async function changePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: readField(formData, "currentPassword"),
    password: readField(formData, "password"),
    confirmPassword: readField(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  if (!isSupabaseConfigured()) {
    return configErrorState();
  }

  const user = await getCurrentUser();
  const email = user?.email;

  if (!user || !email) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again before changing your password.",
    };
  }

  const supabase = await createSupabaseServerClient();

  // Re-authenticate with the current password before changing it. A normal
  // authenticated session must never be enough on its own to set a new
  // password; the recovery flow uses a separate, server-verified path.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    if (verifyError.code === "invalid_credentials") {
      return {
        status: "error",
        message: "Current password is incorrect.",
        fieldErrors: { currentPassword: "Current password is incorrect." },
      };
    }

    return { status: "error", message: mapAuthError(verifyError, "changePassword") };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { status: "error", message: mapAuthError(error, "changePassword") };
  }

  // The re-authentication created the current session; revoke any other
  // devices that still hold tokens. Report a partial result honestly.
  let revokeFailed = false;

  try {
    const { error: revokeError } = await supabase.auth.signOut({ scope: "others" });
    revokeFailed = Boolean(revokeError);
  } catch {
    revokeFailed = true;
  }

  revalidatePath("/", "layout");
  redirect(
    `${ACCOUNT_PASSWORD_PATH}?notice=${
      revokeFailed ? "password-changed-partial" : "password-changed"
    }`,
  );
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: readField(formData, "password"),
    confirmPassword: readField(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  if (!isSupabaseConfigured()) {
    return configErrorState();
  }

  // Only a session created by a recovery link may use this action. The check
  // reads Supabase's signed `amr` claim; it never trusts a client flag or a
  // user ID from the form.
  const recovery = await getRecoveryAuthorization();

  if (!recovery) {
    return {
      status: "error",
      message:
        "This password reset link is invalid or has expired. Request a new link and open it in this browser.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { status: "error", message: mapAuthError(error, "resetPassword") };
  }

  // A recovery session must not remain usable for a second password change.
  // Revoke every session, including this one, and require a fresh sign-in with
  // the new password. If revocation cannot be confirmed, clear the local
  // session anyway and report the partial result instead of claiming success.
  let revokeFailed = false;

  try {
    const { error: revokeError } = await supabase.auth.signOut({ scope: "global" });
    revokeFailed = Boolean(revokeError);
  } catch {
    revokeFailed = true;
  }

  if (revokeFailed) {
    await clearSupabaseAuthCookies().catch(() => false);
  }

  revalidatePath("/", "layout");
  redirect(
    `${SIGN_IN_PATH}?notice=${revokeFailed ? "password-updated-partial" : "password-updated"}`,
  );
}

export async function resendConfirmationAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resendConfirmationSchema.safeParse({ email: readField(formData, "email") });

  if (!parsed.success) {
    return validationErrorState(parsed.error);
  }

  if (!isSupabaseConfigured()) {
    return configErrorState();
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: buildCallbackUrl(DEFAULT_AUTHENTICATED_PATH) },
  });

  if (error && isRateLimitError(error)) {
    return { status: "error", message: mapAuthError(error, "resendConfirmation") };
  }

  return {
    status: "success",
    message:
      "If that address is waiting for confirmation, a new link is on its way. Check spam if it doesn't arrive in a minute.",
  };
}

export async function signOutAction(): Promise<void> {
  let signOutFailed = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();

      try {
        const { error } = await supabase.auth.signOut();
        signOutFailed = Boolean(error);
      } catch {
        signOutFailed = true;
      }

      // A provider outage must not leave the browser holding a session. Clear
      // the local cookies even when the global revocation request failed; the
      // partial notice tells the user that other devices may still be signed in.
      if (signOutFailed) {
        await clearSupabaseAuthCookies().catch(() => false);
      }
    } catch {
      signOutFailed = true;
      await clearSupabaseAuthCookies().catch(() => false);
    }
  }

  revalidatePath("/", "layout");
  redirect(`${SIGN_IN_PATH}?notice=${signOutFailed ? "signed-out-partial" : "signed-out"}`);
}
