"use client";

import { useActionState } from "react";

import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { TextField } from "@/features/auth/components/text-field";
import { changePasswordAction } from "@/features/auth/server/actions";
import { createInitialAuthState } from "@/features/auth/types";

function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, createInitialAuthState());

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "error" && state.message ? (
        <FormMessage tone="error">
          <p>{state.message}</p>
        </FormMessage>
      ) : null}

      <TextField
        id="change-current-password"
        name="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        hint="Confirm the password you use to sign in today."
        required
        autoFocus
        maxLength={72}
        error={state.fieldErrors?.currentPassword}
      />

      <TextField
        id="change-new-password"
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters. Choose something you haven't used here before."
        required
        minLength={8}
        maxLength={72}
        error={state.fieldErrors?.password}
      />

      <TextField
        id="change-confirm-password"
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
        Updating your password signs out other devices that are still using the old one. If you
        don&rsquo;t know your current password, sign out and use the reset link from the sign-in
        screen.
      </p>
    </form>
  );
}

export { ChangePasswordForm };
