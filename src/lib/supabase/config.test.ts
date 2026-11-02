import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSupabaseConfigurationHelp,
  getSupabasePublicConfig,
  isSupabaseConfigured,
  SupabaseConfigurationError,
} from "@/lib/supabase/config";

const VALID_URL = "https://project-ref.supabase.co";
const VALID_KEY = "sb_publishable_public_key_value";

function encodeJwt(payload: Record<string, unknown>): string {
  const part = (value: Record<string, unknown>) =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${part({ alg: "HS256", typ: "JWT" })}.${part(payload)}.signature`;
}

function setEnv(url: string | undefined, key: string | undefined) {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url ?? "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key ?? "");
}

describe("Supabase public configuration", () => {
  beforeEach(() => {
    setEnv(undefined, undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports both missing variables with actionable guidance", () => {
    expect(() => getSupabasePublicConfig()).toThrow(SupabaseConfigurationError);
    expect(() => getSupabasePublicConfig()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => getSupabasePublicConfig()).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
    expect(() => getSupabasePublicConfig()).toThrow(/\.env\.local/);
  });

  it("reports only the variable that is missing", () => {
    setEnv(VALID_URL, undefined);

    expect(() => getSupabasePublicConfig()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
    expect(() => getSupabasePublicConfig()).not.toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL and/);
  });

  it("rejects a malformed URL", () => {
    setEnv("not-a-url", VALID_KEY);

    expect(() => getSupabasePublicConfig()).toThrow(/absolute URL/);
  });

  it("rejects a non-http protocol", () => {
    setEnv("ftp://project-ref.supabase.co", VALID_KEY);

    expect(() => getSupabasePublicConfig()).toThrow(/must use http or https/);
  });

  it("refuses to accept a secret key in a public variable", () => {
    setEnv(VALID_URL, "sb_secret_do_not_ship_this");

    expect(() => getSupabasePublicConfig()).toThrow(/secret key/);
  });

  it("refuses to accept a service-role JWT in a public variable", () => {
    setEnv(VALID_URL, encodeJwt({ role: "service_role" }));

    expect(() => getSupabasePublicConfig()).toThrow(/secret key/);
  });

  it("returns a normalized origin and the publishable key", () => {
    setEnv(`${VALID_URL}/`, VALID_KEY);

    expect(getSupabasePublicConfig()).toEqual({
      url: VALID_URL,
      publishableKey: VALID_KEY,
    });
  });

  it("accepts a legacy anon JWT", () => {
    const anonKey = encodeJwt({ role: "anon" });
    setEnv(VALID_URL, anonKey);

    expect(getSupabasePublicConfig().publishableKey).toBe(anonKey);
  });

  it("reports configuration state without throwing", () => {
    expect(isSupabaseConfigured()).toBe(false);
    expect(getSupabaseConfigurationHelp()).toMatch(/not configured/i);

    setEnv(VALID_URL, VALID_KEY);

    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabaseConfigurationHelp()).toBe("");
  });
});
