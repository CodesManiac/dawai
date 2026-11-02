import { z } from "zod";

import { AUTH_FIELD_NAMES, type AuthFieldName } from "@/features/auth/types";

const email = z
  .string({ error: "Enter your email address." })
  .trim()
  .min(1, { error: "Enter your email address." })
  .max(254, { error: "That email address is too long." })
  .pipe(z.email({ error: "Enter a valid email address." }));

/**
 * Password policy for new passwords.
 *
 * Supabase hashes with bcrypt, which only considers the first 72 bytes. Reject
 * longer values rather than silently weakening them. Composition rules are
 * intentionally absent: length and a breach check (Supabase) matter more than
 * character classes.
 */
const PASSWORD_MAX_BYTES = 72;

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

const newPassword = z
  .string({ error: "Choose a password." })
  .min(8, { error: "Use at least 8 characters." })
  .max(72, { error: "Use 72 characters or fewer." })
  .refine((value) => utf8ByteLength(value) <= PASSWORD_MAX_BYTES, {
    error: "Use a shorter password.",
  });

const existingPassword = z
  .string({ error: "Enter your password." })
  .min(1, { error: "Enter your password." })
  .max(72, { error: "Use 72 characters or fewer." });

const currentPassword = z
  .string({ error: "Enter your current password." })
  .min(1, { error: "Enter your current password." })
  .max(72, { error: "Use 72 characters or fewer." });

const optionalFullName = z
  .string()
  .trim()
  .max(80, { error: "Use 80 characters or fewer." })
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const confirmation = z
  .string({ error: "Re-enter your password." })
  .min(1, { error: "Re-enter your password." });

export const signInSchema = z.object({
  email,
  password: existingPassword,
});

export const signUpSchema = z
  .object({
    fullName: optionalFullName,
    email,
    password: newPassword,
    confirmPassword: confirmation,
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: confirmation,
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const changePasswordSchema = z
  .object({
    currentPassword,
    password: newPassword,
    confirmPassword: confirmation,
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const resendConfirmationSchema = z.object({ email });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResendConfirmationInput = z.infer<typeof resendConfirmationSchema>;

/** Keep only the first message per known field; the UI shows one at a time. */
export function toFieldErrors(error: z.ZodError): Partial<Record<AuthFieldName, string>> {
  const fieldErrors: Partial<Record<AuthFieldName, string>> = {};

  for (const issue of error.issues) {
    const [field] = issue.path;

    if (
      typeof field === "string" &&
      (AUTH_FIELD_NAMES as readonly string[]).includes(field) &&
      fieldErrors[field as AuthFieldName] === undefined
    ) {
      fieldErrors[field as AuthFieldName] = issue.message;
    }
  }

  return fieldErrors;
}
