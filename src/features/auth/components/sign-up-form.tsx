"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormMessage } from "@/features/auth/components/form-message";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { TextField } from "@/features/auth/components/text-field";
import { signUpAction } from "@/features/auth/server/actions";
import { createInitialAuthState } from "@/features/auth/types";
import { CONFIRM_EMAIL_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";

function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, createInitialAuthState());

  if (state.status === "success") {
    return (
      <div className="space-y-5">
        <FormMessage tone="success">
          <p className="font-semibold">Check your inbox to finish setting up.</p>
          <p className="mt-1">
            {state.submittedEmail ? (
              <>
                Look for a confirmation link at{" "}
                <span className="font-semibold">{state.submittedEmail}</span>.
              </>
            ) : (
              "Look for a confirmation link in your inbox."
            )}{" "}
            Open it in this browser to activate your account. If you already confirmed this address,
            sign in instead.
          </p>
        </FormMessage>

        <p className="text-xs leading-relaxed text-ink-muted/80">
          Nothing yet? Check spam, then request another link. Confirmation links expire and can only
          be used once.
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href={CONFIRM_EMAIL_PATH}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border-strong px-5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-foreground/5"
          >
            Resend confirmation email
          </Link>
          <Link
            href={SIGN_IN_PATH}
            className="inline-flex h-11 items-center justify-center rounded-lg text-sm font-semibold text-ink-muted transition-colors duration-200 hover:text-foreground"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "error" && state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}

      <TextField
        id="sign-up-name"
        name="fullName"
        label="Name (optional)"
        autoComplete="name"
        placeholder="How should we address you?"
        maxLength={80}
        error={state.fieldErrors?.fullName}
      />

      <TextField
        id="sign-up-email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        required
        error={state.fieldErrors?.email}
      />

      <TextField
        id="sign-up-password"
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters. A short phrase beats a clever substitution."
        required
        minLength={8}
        maxLength={72}
        error={state.fieldErrors?.password}
      />

      <TextField
        id="sign-up-confirm-password"
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        required
        maxLength={72}
        error={state.fieldErrors?.confirmPassword}
      />

      <SubmitButton pendingLabel="Creating account…" size="lg" className="w-full">
        Create account
      </SubmitButton>

      <p className="text-center text-sm leading-relaxed text-ink-muted">
        Already have an account?{" "}
        <Link
          href={SIGN_IN_PATH}
          className="rounded-sm font-semibold text-foreground underline decoration-progress decoration-2 underline-offset-4 hover:decoration-foreground"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-[0.6875rem] leading-relaxed text-ink-muted/60">
        We use your email for sign-in and account recovery. No marketing email is sent in this task.
      </p>
    </form>
  );
}

export { SignUpForm };
