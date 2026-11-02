import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  toFieldErrors,
} from "@/features/auth/schemas/auth";

describe("sign-in validation", () => {
  it("normalizes the email and accepts a valid payload", () => {
    const result = signInSchema.safeParse({
      email: "  reader@example.com  ",
      password: "correct horse battery",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("reader@example.com");
    }
  });

  it("rejects a malformed email", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "x" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).email).toMatch(/valid email/i);
    }
  });

  it("requires a password", () => {
    const result = signInSchema.safeParse({ email: "reader@example.com", password: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).password).toMatch(/enter your password/i);
    }
  });
});

describe("sign-up validation", () => {
  const valid = {
    fullName: "  Ada Lovelace  ",
    email: "ada@example.com",
    password: "analytical-engine",
    confirmPassword: "analytical-engine",
  };

  it("accepts a valid payload and trims the optional name", () => {
    const result = signUpSchema.safeParse(valid);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBe("Ada Lovelace");
    }
  });

  it("treats an empty name as absent", () => {
    const result = signUpSchema.safeParse({ ...valid, fullName: "   " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fullName).toBeUndefined();
    }
  });

  it("rejects passwords shorter than eight characters", () => {
    const result = signUpSchema.safeParse({
      ...valid,
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).password).toMatch(/at least 8/i);
    }
  });

  it("rejects passwords longer than 72 characters", () => {
    const long = "a".repeat(73);
    const result = signUpSchema.safeParse({ ...valid, password: long, confirmPassword: long });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).password).toMatch(/72 characters or fewer/i);
    }
  });

  it("rejects passwords longer than 72 UTF-8 bytes even under 72 characters", () => {
    const long = "🔐".repeat(20);
    const result = signUpSchema.safeParse({ ...valid, password: long, confirmPassword: long });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).password).toMatch(/shorter password/i);
    }
  });

  it("rejects mismatched confirmation with a field-specific message", () => {
    const result = signUpSchema.safeParse({ ...valid, confirmPassword: "different-password" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).confirmPassword).toBe("Passwords do not match.");
    }
  });
});

describe("password reset validation", () => {
  it("requires matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: "new-password-1",
      confirmPassword: "new-password-2",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).confirmPassword).toBe("Passwords do not match.");
    }
  });

  it("accepts a matching pair", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "new-password-1",
        confirmPassword: "new-password-1",
      }).success,
    ).toBe(true);
  });
});

describe("change password validation", () => {
  const valid = {
    currentPassword: "old-password-1",
    password: "new-password-1",
    confirmPassword: "new-password-1",
  };

  it("requires the current password", () => {
    const result = changePasswordSchema.safeParse({ ...valid, currentPassword: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).currentPassword).toMatch(/current password/i);
    }
  });

  it("requires a valid new password and matching confirmation", () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(toFieldErrors(result.error).password).toMatch(/at least 8/i);
    }

    const mismatch = changePasswordSchema.safeParse({
      ...valid,
      confirmPassword: "different-password",
    });

    expect(mismatch.success).toBe(false);
    if (!mismatch.success) {
      expect(toFieldErrors(mismatch.error).confirmPassword).toBe("Passwords do not match.");
    }
  });

  it("accepts a complete change request", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });
});

describe("forgot password validation", () => {
  it("requires a valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "nope" });

    expect(result.success).toBe(false);
  });
});

describe("toFieldErrors", () => {
  it("keeps only the first message per field and ignores unknown paths", () => {
    const result = signUpSchema.safeParse({
      fullName: "",
      email: "bad",
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = toFieldErrors(result.error);
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
      expect(Object.keys(errors).length).toBeLessThanOrEqual(2);
    }
  });
});
