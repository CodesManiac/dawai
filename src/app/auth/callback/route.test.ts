import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeAuthCallbackCode: vi.fn(),
}));

vi.mock("@/features/auth/server/callback", () => ({
  exchangeAuthCallbackCode: mocks.exchangeAuthCallbackCode,
}));

import { GET } from "@/app/auth/callback/route";

function request(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

function location(response: Response): string | null {
  return response.headers.get("location");
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps a provider error to a recoverable expired-link message", async () => {
    const response = await GET(
      request("/auth/callback?error=access_denied&error_code=otp_expired"),
    );

    expect(response.status).toBe(307);
    expect(location(response)).toBe("http://localhost:3000/sign-in?error=expired-link");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.exchangeAuthCallbackCode).not.toHaveBeenCalled();
  });

  it("rejects a callback with no code as an invalid link", async () => {
    const response = await GET(request("/auth/callback"));

    expect(location(response)).toBe("http://localhost:3000/sign-in?error=invalid-link");
    expect(mocks.exchangeAuthCallbackCode).not.toHaveBeenCalled();
  });

  it("maps an expired exchange failure to the expired-link message", async () => {
    mocks.exchangeAuthCallbackCode.mockResolvedValue({ ok: false, errorCode: "otp_expired" });

    const response = await GET(request("/auth/callback?code=expired-code"));

    expect(location(response)).toBe("http://localhost:3000/sign-in?error=expired-link");
  });

  it("maps an auth outage to a retryable message", async () => {
    mocks.exchangeAuthCallbackCode.mockResolvedValue({
      ok: false,
      errorCode: "auth_unavailable",
    });

    const response = await GET(request("/auth/callback?code=some-code"));

    expect(location(response)).toBe("http://localhost:3000/sign-in?error=auth-unavailable");
  });

  it("sanitizes the next path before exchanging the code", async () => {
    const successResponse = NextResponse.redirect(new URL("/dashboard", "http://localhost:3000"));
    successResponse.cookies.set("sb-test", "session-value", { httpOnly: true, path: "/" });
    mocks.exchangeAuthCallbackCode.mockResolvedValue({ ok: true, response: successResponse });

    const response = await GET(
      request("/auth/callback?code=valid-code&next=https%3A%2F%2Fevil.example%2Fsteal"),
    );

    expect(mocks.exchangeAuthCallbackCode).toHaveBeenCalledWith(
      expect.any(NextRequest),
      "valid-code",
      "/dashboard",
    );
    expect(response).toBe(successResponse);
    expect(location(response)).toBe("http://localhost:3000/dashboard");
    expect(response.cookies.get("sb-test")?.value).toBe("session-value");
  });

  it("forwards a recovery callback to the reset page", async () => {
    const successResponse = NextResponse.redirect(
      new URL("/reset-password", "http://localhost:3000"),
    );
    mocks.exchangeAuthCallbackCode.mockResolvedValue({ ok: true, response: successResponse });

    await GET(request("/auth/callback?code=valid-code&next=%2Freset-password"));

    expect(mocks.exchangeAuthCallbackCode).toHaveBeenCalledWith(
      expect.any(NextRequest),
      "valid-code",
      "/reset-password",
    );
  });

  it("still refuses to send a callback to another auth screen", async () => {
    const successResponse = NextResponse.redirect(new URL("/dashboard", "http://localhost:3000"));
    mocks.exchangeAuthCallbackCode.mockResolvedValue({ ok: true, response: successResponse });

    await GET(request("/auth/callback?code=valid-code&next=%2Fsign-in"));

    expect(mocks.exchangeAuthCallbackCode).toHaveBeenCalledWith(
      expect.any(NextRequest),
      "valid-code",
      "/dashboard",
    );
  });

  it("allows the account password page as a safe destination", async () => {
    const successResponse = NextResponse.redirect(
      new URL("/account/password", "http://localhost:3000"),
    );
    mocks.exchangeAuthCallbackCode.mockResolvedValue({ ok: true, response: successResponse });

    await GET(request("/auth/callback?code=valid-code&next=%2Faccount%2Fpassword"));

    expect(mocks.exchangeAuthCallbackCode).toHaveBeenCalledWith(
      expect.any(NextRequest),
      "valid-code",
      "/account/password",
    );
  });
});
