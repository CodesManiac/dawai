"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { TextField } from "@/features/auth/components/text-field";
import { forgotPasswordAction } from "@/features/auth/server/actions";
import { createInitialAuthState } from "@/features/auth/types";
import { SIGN_IN_PATH } from "@/lib/auth/routes";

function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, createInitialAuthState());

  if (state.status === "success") {
    return (
      <div className="space-y-5">
        <FormMessage tone="success">
          <p className="font-semibold">Check your email.</p>
          <p className="mt-1">{state.message}</p>
        </FormMessage>

        <p className="text-xs leading-relaxed text-ink-muted/80">
          Open the link in the same browser you use to sign in. If it has expired, return here and
          request a new one.
        </p>

        <Link
          href={SIGN_IN_PATH}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border-strong px-5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-foreground/5"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}

      <TextField
        id="forgot-email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        required
        autoFocus
        error={state.fieldErrors?.email}
      />

      <SubmitButton pendingLabel="Sending link…" size="lg" className="w-full">
        Send reset link
      </SubmitButton>

      <p className="text-center text-sm leading-relaxed text-ink-muted">
        Remembered it?{" "}
        <Link
          href={SIGN_IN_PATH}
          className="rounded-sm font-semibold text-foreground underline decoration-progress decoration-2 underline-offset-4 hover:decoration-foreground"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export { ForgotPasswordForm };
