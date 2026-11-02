import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

import { clearSupabaseAuthCookies } from "@/server/supabase/server";

function useCookieStore(names: string[], remove = vi.fn()) {
  mocks.cookies.mockResolvedValue({
    getAll: () => names.map((name) => ({ name, value: "value" })),
    delete: remove,
  });
  return remove;
}

describe("clearSupabaseAuthCookies", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project-ref.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_key");
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("deletes the auth token, its chunks, and its flow cookies", async () => {
    const remove = useCookieStore([
      "sb-project-ref-auth-token",
      "sb-project-ref-auth-token.0",
      "sb-project-ref-auth-token-code-verifier",
      "sb-project-ref-auth-token-flow-123-code-verifier",
      "sb-other-project-auth-token",
      "theme",
    ]);

    await expect(clearSupabaseAuthCookies()).resolves.toBe(true);

    expect(remove).toHaveBeenCalledTimes(4);
    expect(remove).toHaveBeenCalledWith("sb-project-ref-auth-token");
    expect(remove).toHaveBeenCalledWith("sb-project-ref-auth-token.0");
    expect(remove).toHaveBeenCalledWith("sb-project-ref-auth-token-code-verifier");
    expect(remove).toHaveBeenCalledWith("sb-project-ref-auth-token-flow-123-code-verifier");
    expect(remove).not.toHaveBeenCalledWith("sb-other-project-auth-token");
    expect(remove).not.toHaveBeenCalledWith("theme");
  });

  it("reports failure when a cookie cannot be deleted", async () => {
    const remove = useCookieStore(
      ["sb-project-ref-auth-token"],
      vi.fn(() => {
        throw new Error("read-only");
      }),
    );

    await expect(clearSupabaseAuthCookies()).resolves.toBe(false);
    expect(remove).toHaveBeenCalledWith("sb-project-ref-auth-token");
  });

  it("is a no-op success when Supabase is unconfigured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    await expect(clearSupabaseAuthCookies()).resolves.toBe(true);
    expect(mocks.cookies).not.toHaveBeenCalled();
  });
});
