import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refreshSupabaseSession: vi.fn(),
}));

vi.mock("@/server/supabase/proxy-session", () => ({
  refreshSupabaseSession: mocks.refreshSupabaseSession,
}));

import { proxy } from "@/proxy";

function request(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

function session({
  user = null,
  configured = true,
  cookie,
}: {
  user?: { id: string } | null;
  configured?: boolean;
  cookie?: { name: string; value: string };
} = {}) {
  const response = NextResponse.next();
  if (cookie) {
    response.cookies.set(cookie.name, cookie.value, { httpOnly: true, path: "/" });
  }
  mocks.refreshSupabaseSession.mockResolvedValue({ response, user, configured });
}

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects a guest from a protected path and preserves the intended destination", async () => {
    session({ cookie: { name: "sb-refreshed", value: "cookie-value" } });

    const response = await proxy(request("/dashboard?tab=sources"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?next=%2Fdashboard%3Ftab%3Dsources",
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.cookies.get("sb-refreshed")?.value).toBe("cookie-value");
  });

  it("treats the account password page as protected", async () => {
    session();

    const response = await proxy(request("/account/password"));

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?next=%2Faccount%2Fpassword",
    );
  });

  it("keeps an authenticated user out of guest-only auth screens", async () => {
    session({ user: { id: "user-1" } });

    const response = await proxy(request("/sign-in?next=%2Fdashboard"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("does not redirect an authenticated user away from the reset page", async () => {
    session({ user: { id: "user-1" } });

    const response = await proxy(request("/reset-password"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("marks authenticated protected responses as private", async () => {
    session({ user: { id: "user-1" } });

    const response = await proxy(request("/dashboard"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("leaves requests alone when Supabase is unconfigured", async () => {
    session({ configured: false });

    const response = await proxy(request("/dashboard"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("cache-control")).toBeNull();
  });
});
