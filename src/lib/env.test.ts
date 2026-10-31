import { afterEach, describe, expect, it, vi } from "vitest";

import { getAppUrl } from "./env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAppUrl", () => {
  it("falls back to localhost when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");

    expect(getAppUrl().toString()).toBe("http://localhost:3000/");
  });

  it("uses a valid configured URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://dawai.example");

    expect(getAppUrl().toString()).toBe("https://dawai.example/");
  });

  it("rejects a malformed URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "not-a-url");

    expect(() => getAppUrl()).toThrow(/absolute URL/);
  });

  it("rejects non-http protocols", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "ftp://dawai.example");

    expect(() => getAppUrl()).toThrow(/http or https/);
  });
});
