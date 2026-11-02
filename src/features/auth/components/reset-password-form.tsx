"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { TextField } from "@/features/auth/components/text-field";
import { resetPasswordAction } from "@/features/auth/server/actions";
import { createInitialAuthState } from "@/features/auth/types";
import { FORGOT_PASSWORD_PATH } from "@/lib/auth/routes";

function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, createInitialAuthState());

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "error" && state.message ? (
        <FormMessage tone="error">
          <p>{state.message}</p>
          <p className="mt-1.5">
            <Link
              href={FORGOT_PASSWORD_PATH}
              className="rounded-sm font-semibold text-foreground underline decoration-progress decoration-2 underline-offset-4 hover:decoration-foreground"
            >
              Request a new reset link
            </Link>
          </p>
        </FormMessage>
      ) : null}

      <TextField
        id="reset-password"
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters. Choose something you haven't used here before."
        required
        autoFocus
        minLength={8}
        maxLength={72}
        error={state.fieldErrors?.password}
      />

      <TextField
        id="reset-confirm-password"
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        maxLength={72}
        error={state.fieldErrors?.confirmPassword}
      />

      <SubmitButton pendingLabel="Updating password…" size="lg" className="w-full">
        Update password
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-ink-muted/70">
        Updating your password signs out every device, including this one. You&rsquo;ll sign in
        again with the new password.
      </p>
    </form>
  );
}

export { ResetPasswordForm };
