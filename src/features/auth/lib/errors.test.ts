import { describe, expect, it } from "vitest";

import { isRateLimitError, mapAuthError } from "@/features/auth/lib/errors";

describe("mapAuthError", () => {
  it("maps invalid credentials without disclosing which field failed", () => {
    const message = mapAuthError({ code: "invalid_credentials" }, "signIn");

    expect(message).toBe("Email or password is incorrect.");
  });

  it("tells unconfirmed users how to proceed", () => {
    expect(mapAuthError({ code: "email_not_confirmed" }, "signIn")).toMatch(
      /confirm your email address/i,
    );
  });

  it("maps every known rate-limit code to one actionable message", () => {
    for (const code of [
      "over_request_rate_limit",
      "over_email_send_rate_limit",
      "over_sms_send_rate_limit",
      "rate_limit_exceeded",
    ]) {
      expect(mapAuthError({ code }, "forgotPassword")).toMatch(/Too many attempts/);
    }
  });

  it("maps expired links", () => {
    expect(mapAuthError({ code: "otp_expired" }, "resetPassword")).toMatch(
      /expired or was already used/,
    );
  });

  it("maps expired sessions", () => {
    expect(mapAuthError({ code: "refresh_token_not_found" }, "signIn")).toMatch(/session expired/i);
  });

  it("keeps account-existence errors generic", () => {
    const message = mapAuthError({ code: "user_already_exists" }, "signUp");

    expect(message).not.toMatch(/already/i);
    expect(message).toMatch(/signing in|resetting/i);
  });

  it("falls back per context for unknown or missing codes", () => {
    expect(mapAuthError({ code: "some_new_code" }, "signIn")).toMatch(/couldn't sign you in/i);
    expect(mapAuthError(null, "signUp")).toMatch(/couldn't create your account/i);
    expect(mapAuthError(undefined, "resetPassword")).toMatch(/couldn't update your password/i);
    expect(mapAuthError(undefined, "changePassword")).toMatch(/couldn't update your password/i);
  });
});

describe("isRateLimitError", () => {
  it("recognizes rate-limit codes only", () => {
    expect(isRateLimitError({ code: "over_request_rate_limit" })).toBe(true);
    expect(isRateLimitError({ code: "invalid_credentials" })).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
  });
});
