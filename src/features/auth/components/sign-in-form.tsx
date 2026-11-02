"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { TextField } from "@/features/auth/components/text-field";
import { signInAction } from "@/features/auth/server/actions";
import { createInitialAuthState } from "@/features/auth/types";
import { FORGOT_PASSWORD_PATH, SIGN_UP_PATH } from "@/lib/auth/routes";

type SignInFormProps = {
  next: string;
};

function SignInForm({ next }: SignInFormProps) {
  const [state, formAction] = useActionState(signInAction, createInitialAuthState());

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="next" value={next} />

      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}

      <TextField
        id="sign-in-email"
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

      <TextField
        id="sign-in-password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
        labelAddon={
          <Link
            href={FORGOT_PASSWORD_PATH}
            className="rounded-sm text-xs font-semibold text-foreground underline decoration-progress decoration-2 underline-offset-4 hover:decoration-foreground"
          >
            Forgot password?
          </Link>
        }
      />

      <SubmitButton pendingLabel="Signing in…" size="lg" className="w-full">
        Sign in
      </SubmitButton>

      <p className="text-center text-sm leading-relaxed text-ink-muted">
        New to Dawai?{" "}
        <Link
          href={SIGN_UP_PATH}
          className="rounded-sm font-semibold text-foreground underline decoration-progress decoration-2 underline-offset-4 hover:decoration-foreground"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export { SignInForm };
