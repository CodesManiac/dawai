import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/server/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { redirect } from "next/navigation";

import {
  getRecoveryAuthenticationTimestamp,
  getRecoveryAuthorization,
  RECOVERY_AUTHORIZATION_MAX_AGE_MS,
  requireUser,
} from "@/features/auth/server/session";

function useUser(
  user: { id: string; email?: string } | null,
  error: { code: string } | null = null,
) {
  mocks.createSupabaseServerClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error }),
    },
  } as never);
}

function useRecoveryAuth({
  user = { id: "user-1", email: "reader@example.com" },
  userError = null,
  claims = {
    sub: "user-1",
    amr: [{ method: "recovery", timestamp: Math.floor(Date.now() / 1000) - 60 }],
  },
  claimsError = null,
}: {
  user?: { id: string; email?: string } | null;
  userError?: { code: string } | null;
  claims?: unknown;
  claimsError?: { code: string } | null;
} = {}) {
  mocks.createSupabaseServerClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: userError }),
      getClaims: vi
        .fn()
        .mockResolvedValue({ data: claims ? { claims } : null, error: claimsError }),
    },
  } as never);
}

describe("requireUser", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project-ref.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_key");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("redirects guests to sign-in with a safe return path", async () => {
    useUser(null, { code: "session_not_found" });

    await expect(requireUser("/dashboard?tab=sources")).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/sign-in?next=%2Fdashboard%3Ftab%3Dsources");
  });

  it("never redirects back to an auth screen", async () => {
    useUser(null);

    await expect(requireUser("/sign-in?next=/dashboard")).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/sign-in?next=%2Fdashboard");
  });

  it("returns the verified user without redirecting", async () => {
    const user = { id: "user-1", email: "reader@example.com" };
    useUser(user);

    await expect(requireUser("/dashboard")).resolves.toEqual(user);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("treats an unconfigured environment as unauthenticated", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/sign-in?next=%2Fdashboard");
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });
});

describe("getRecoveryAuthenticationTimestamp", () => {
  it("returns the most recent detailed recovery timestamp", () => {
    expect(
      getRecoveryAuthenticationTimestamp([
        { method: "password", timestamp: 10 },
        { method: "recovery", timestamp: 20 },
        { method: "recovery", timestamp: 30 },
      ]),
    ).toBe(30);
  });

  it("rejects ordinary password sessions and malformed claims", () => {
    expect(getRecoveryAuthenticationTimestamp([{ method: "password", timestamp: 1 }])).toBeNull();
    expect(getRecoveryAuthenticationTimestamp(["password"])).toBeNull();
    expect(getRecoveryAuthenticationTimestamp(["recovery"])).toBeNull();
    expect(getRecoveryAuthenticationTimestamp(undefined)).toBeNull();
    expect(getRecoveryAuthenticationTimestamp("recovery")).toBeNull();
    expect(getRecoveryAuthenticationTimestamp([null, 42, { method: "otp" }])).toBeNull();
    expect(getRecoveryAuthenticationTimestamp([{ method: "recovery" }])).toBeNull();
  });
});

describe("getRecoveryAuthorization", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project-ref.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_key");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns the user for a server-verified recovery session", async () => {
    useRecoveryAuth();

    await expect(getRecoveryAuthorization()).resolves.toEqual({
      user: { id: "user-1", email: "reader@example.com" },
    });
  });

  it("rejects a string-only recovery claim because recency cannot be verified", async () => {
    useRecoveryAuth({ claims: { sub: "user-1", amr: ["recovery"] } });

    await expect(getRecoveryAuthorization()).resolves.toBeNull();
  });

  it("rejects a normal authenticated session", async () => {
    useRecoveryAuth({ claims: { sub: "user-1", amr: [{ method: "password" }] } });

    await expect(getRecoveryAuthorization()).resolves.toBeNull();
  });

  it("rejects a recovery session older than the authorization window", async () => {
    useRecoveryAuth({
      claims: {
        sub: "user-1",
        amr: [
          {
            method: "recovery",
            timestamp: Math.floor((Date.now() - RECOVERY_AUTHORIZATION_MAX_AGE_MS) / 1000) - 1,
          },
        ],
      },
    });

    await expect(getRecoveryAuthorization()).resolves.toBeNull();
  });

  it("rejects claims that belong to a different subject", async () => {
    useRecoveryAuth({ claims: { sub: "user-2", amr: ["recovery"] } });

    await expect(getRecoveryAuthorization()).resolves.toBeNull();
  });

  it("fails closed when the claims cannot be verified", async () => {
    useRecoveryAuth({ claimsError: { code: "bad_jwt" } });

    await expect(getRecoveryAuthorization()).resolves.toBeNull();
  });

  it("fails closed when the user cannot be verified", async () => {
    useRecoveryAuth({ user: null, userError: { code: "session_not_found" } });

    await expect(getRecoveryAuthorization()).resolves.toBeNull();
  });

  it("treats an unconfigured environment as unauthorized", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(getRecoveryAuthorization()).resolves.toBeNull();
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });
});
