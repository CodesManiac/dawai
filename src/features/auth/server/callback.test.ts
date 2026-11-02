import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

import { exchangeAuthCallbackCode } from "@/features/auth/server/callback";

type CookieOptions = Record<string, unknown>;

function request(path = "/auth/callback?code=abc"): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    headers: { cookie: "sb-old=old-value" },
  });
}

function useSupabase(
  exchange: (options: {
    cookies: {
      setAll: (
        cookies: { name: string; value: string; options?: CookieOptions }[],
        headers?: Record<string, string>,
      ) => void;
    };
  }) => Promise<{ error: { code: string } | null }>,
) {
  mocks.createServerClient.mockImplementation((_url, _key, options: never) => {
    const cookieOptions = (options as unknown as { cookies: never }).cookies;
    return {
      auth: {
        exchangeCodeForSession: vi.fn(() => exchange({ cookies: cookieOptions })),
      },
    };
  });
}

describe("exchangeAuthCallbackCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project-ref.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_key");
  });

  it("exchanges the code and copies session cookies onto the redirect", async () => {
    useSupabase(async ({ cookies }) => {
      cookies.setAll(
        [
          {
            name: "sb-project-auth-token",
            value: "new-session",
            options: { httpOnly: true, path: "/", sameSite: "lax" },
          },
        ],
        { "Cache-Control": "private, no-store" },
      );
      return { error: null };
    });

    const result = await exchangeAuthCallbackCode(request(), "abc", "/dashboard");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.response.headers.get("location")).toBe("http://localhost:3000/dashboard");
    expect(result.response.cookies.get("sb-project-auth-token")?.value).toBe("new-session");
    expect(result.response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.createServerClient).toHaveBeenCalledWith(
      "https://project-ref.supabase.co",
      "sb_publishable_test_key",
      expect.objectContaining({ global: expect.any(Object) }),
    );
  });

  it("returns the provider error code without redirecting", async () => {
    useSupabase(async () => ({ error: { code: "otp_expired" } }));

    await expect(exchangeAuthCallbackCode(request(), "abc", "/dashboard")).resolves.toEqual({
      ok: false,
      errorCode: "otp_expired",
    });
  });

  it("treats a thrown network or timeout failure as auth unavailable", async () => {
    useSupabase(async () => {
      throw new Error("timed out");
    });

    await expect(exchangeAuthCallbackCode(request(), "abc", "/dashboard")).resolves.toEqual({
      ok: false,
      errorCode: "auth_unavailable",
    });
  });

  it("does not call Supabase when configuration is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(exchangeAuthCallbackCode(request(), "abc", "/dashboard")).resolves.toEqual({
      ok: false,
      errorCode: "not_configured",
    });
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
});
