import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("flex", "items-center")).toBe("flex items-center");
  });

  it("lets the last conflicting utility win", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("bg-ai", "bg-progress")).toBe("bg-progress");
  });

  it("handles conditional inputs", () => {
    expect(cn("text-sm", false, undefined, null, { "font-bold": true })).toBe("text-sm font-bold");
  });
});
