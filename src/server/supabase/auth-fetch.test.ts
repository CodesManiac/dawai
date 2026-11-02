import { afterEach, describe, expect, it, vi } from "vitest";

import { authFetch } from "@/server/supabase/auth-fetch";

describe("authFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("aborts a Supabase request that never settles", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });

    const request = authFetch("https://example.invalid/auth/v1/token");
    const assertion = expect(request).rejects.toMatchObject({ name: "AbortError" });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.invalid/auth/v1/token",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("clears its timer when the request completes", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await expect(authFetch("https://example.invalid/health")).resolves.toBeInstanceOf(Response);
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
