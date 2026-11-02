import { describe, expect, it } from "vitest";

import { sanitizeRedirectPath } from "@/lib/auth/redirects";

describe("sanitizeRedirectPath", () => {
  it("keeps a same-origin path with query and hash", () => {
    expect(sanitizeRedirectPath("/dashboard?tab=sources#recent")).toBe(
      "/dashboard?tab=sources#recent",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeRedirectPath("  /dashboard  ")).toBe("/dashboard");
  });

  it("falls back for non-string input", () => {
    expect(sanitizeRedirectPath(undefined)).toBe("/dashboard");
    expect(sanitizeRedirectPath(null)).toBe("/dashboard");
    expect(sanitizeRedirectPath(42)).toBe("/dashboard");
    expect(sanitizeRedirectPath({ next: "/dashboard" })).toBe("/dashboard");
  });

  it("falls back for empty or relative paths", () => {
    expect(sanitizeRedirectPath("")).toBe("/dashboard");
    expect(sanitizeRedirectPath("   ")).toBe("/dashboard");
    expect(sanitizeRedirectPath("dashboard")).toBe("/dashboard");
  });

  it("rejects absolute URLs", () => {
    expect(sanitizeRedirectPath("https://evil.example/phish")).toBe("/dashboard");
    expect(sanitizeRedirectPath("http://localhost:3000/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
    expect(sanitizeRedirectPath("data:text/html,hi")).toBe("/dashboard");
  });

  it("rejects protocol-relative and backslash tricks", () => {
    expect(sanitizeRedirectPath("//evil.example")).toBe("/dashboard");
    expect(sanitizeRedirectPath("//evil.example/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/dashboard\\@evil.example")).toBe("/dashboard");
  });

  it("rejects dot-segment normalization into a protocol-relative URL", () => {
    expect(sanitizeRedirectPath("/..//evil.example")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/%2e%2e//evil.example")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/%2E%2E//evil.example")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/foo/..//evil.example")).toBe("/dashboard");
  });

  it("rejects escaped path separators", () => {
    expect(sanitizeRedirectPath("/%2f%2fevil.example")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/foo%2Fbar")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/foo%5cbar")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/dashboard?tab=%2f%2fevil.example")).toBe(
      "/dashboard?tab=%2f%2fevil.example",
    );
  });

  it("rejects double-encoded separators and dot segments", () => {
    expect(sanitizeRedirectPath("/%252f%252fevil.example")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/foo%252Fbar")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/%25252f%25252fevil.example")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/%252e%252e//evil.example")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/%25zz")).toBe("/dashboard");
  });

  it("rejects control characters and overlong values", () => {
    expect(sanitizeRedirectPath("/dashboard\u0000")).toBe("/dashboard");
    expect(sanitizeRedirectPath(`/${"a".repeat(2048)}`)).toBe("/dashboard");
  });

  it("refuses to bounce back to auth screens", () => {
    expect(sanitizeRedirectPath("/sign-in")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/sign-in?next=/dashboard")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/sign-up")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/forgot-password")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/reset-password")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/confirm-email")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/auth/callback?code=x")).toBe("/dashboard");
  });

  it("allows the reset page only when the email callback opts in", () => {
    expect(
      sanitizeRedirectPath("/reset-password", "/dashboard", { allowResetPassword: true }),
    ).toBe("/reset-password");
    expect(
      sanitizeRedirectPath("/reset-password?code=abc", "/dashboard", {
        allowResetPassword: true,
      }),
    ).toBe("/reset-password?code=abc");
    expect(
      sanitizeRedirectPath("/reset-password/extra", "/dashboard", {
        allowResetPassword: true,
      }),
    ).toBe("/dashboard");
    expect(sanitizeRedirectPath("/sign-in", "/dashboard", { allowResetPassword: true })).toBe(
      "/dashboard",
    );
  });

  it("accepts nested protected paths and the site root", () => {
    expect(sanitizeRedirectPath("/dashboard/library/42")).toBe("/dashboard/library/42");
    expect(sanitizeRedirectPath("/account/password")).toBe("/account/password");
    expect(sanitizeRedirectPath("/")).toBe("/");
  });

  it("uses a caller-provided fallback when invalid", () => {
    expect(sanitizeRedirectPath("https://evil.example", "/dashboard?notice=fallback")).toBe(
      "/dashboard?notice=fallback",
    );
  });
});
