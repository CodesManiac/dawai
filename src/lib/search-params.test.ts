import { describe, expect, it } from "vitest";

import { firstSearchParam } from "@/lib/search-params";

describe("firstSearchParam", () => {
  it("returns a single value unchanged", () => {
    expect(firstSearchParam("signed-out")).toBe("signed-out");
  });

  it("returns the first value of a repeated parameter", () => {
    expect(firstSearchParam(["first", "second"])).toBe("first");
  });

  it("returns undefined when the parameter is absent", () => {
    expect(firstSearchParam(undefined)).toBeUndefined();
  });
});
