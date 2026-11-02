"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { TextField } from "@/features/auth/components/text-field";
import { resendConfirmationAction } from "@/features/auth/server/actions";
import { createInitialAuthState } from "@/features/auth/types";
import { SIGN_IN_PATH } from "@/lib/auth/routes";

function ResendConfirmationForm() {
  const [state, formAction] = useActionState(resendConfirmationAction, createInitialAuthState());

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}

      {state.status === "success" && state.message ? (
        <FormMessage tone="success">{state.message}</FormMessage>
      ) : null}

      <TextField
        id="resend-email"
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

      <SubmitButton pendingLabel="Sending…" size="lg" className="w-full">
        Resend confirmation email
      </SubmitButton>

      <p className="text-center text-sm leading-relaxed text-ink-muted">
        Already confirmed?{" "}
        <Link
          href={SIGN_IN_PATH}
          className="rounded-sm font-semibold text-foreground underline decoration-progress decoration-2 underline-offset-4 hover:decoration-foreground"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

export { ResendConfirmationForm };
