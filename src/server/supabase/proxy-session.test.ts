import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

import { refreshSupabaseSession } from "@/server/supabase/proxy-session";

function request(path = "/dashboard"): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    headers: { cookie: "sb-old=old-value" },
  });
}

function useSupabase(
  getUser: (options: {
    cookies: {
      setAll: (
        cookies: { name: string; value: string; options?: Record<string, unknown> }[],
        headers?: Record<string, string>,
      ) => void;
    };
  }) => Promise<{ data: { user: { id: string } | null }; error: { code: string } | null }>,
) {
  mocks.createServerClient.mockImplementation((_url, _key, options: unknown) => {
    const cookieOptions = (options as { cookies: never }).cookies;
    return {
      auth: {
        getUser: vi.fn(() => getUser({ cookies: cookieOptions })),
      },
    };
  });
}

describe("refreshSupabaseSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project-ref.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("writes refreshed cookies to both the request and the response", async () => {
    useSupabase(async ({ cookies }) => {
      cookies.setAll(
        [
          {
            name: "sb-project-auth-token",
            value: "refreshed-session",
            options: { httpOnly: true, path: "/", sameSite: "lax" },
          },
        ],
        { "Cache-Control": "private, no-store" },
      );
      return { data: { user: { id: "user-1" } }, error: null };
    });

    const nextRequest = request();
    const result = await refreshSupabaseSession(nextRequest);

    expect(result.configured).toBe(true);
    expect(result.user).toEqual({ id: "user-1" });
    expect(nextRequest.cookies.get("sb-project-auth-token")?.value).toBe("refreshed-session");
    expect(result.response.cookies.get("sb-project-auth-token")?.value).toBe("refreshed-session");
    expect(result.response.headers.get("cache-control")).toContain("no-store");
  });

  it("treats a provider error as a guest without throwing", async () => {
    useSupabase(async () => ({
      data: { user: null },
      error: { code: "session_not_found" },
    }));

    const result = await refreshSupabaseSession(request());

    expect(result.configured).toBe(true);
    expect(result.user).toBeNull();
  });

  it("treats a thrown network failure as a guest", async () => {
    useSupabase(async () => {
      throw new Error("network down");
    });

    const result = await refreshSupabaseSession(request());

    expect(result.configured).toBe(true);
    expect(result.user).toBeNull();
  });

  it("does not create a client when Supabase is unconfigured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const result = await refreshSupabaseSession(request());

    expect(result.configured).toBe(false);
    expect(result.user).toBeNull();
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
});
