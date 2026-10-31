import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Progress } from "./progress";

describe("Progress", () => {
  it("exposes the rounded value to assistive technology", () => {
    render(<Progress value={68.4} label="Weekly recall" />);

    const progress = screen.getByRole("progressbar", { name: "Weekly recall" });

    expect(progress).toHaveAttribute("aria-valuenow", "68");
    expect(progress).toHaveAttribute("aria-valuemin", "0");
    expect(progress).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps values outside the 0–100 range", () => {
    const { rerender } = render(<Progress value={140} label="Coverage" />);
    expect(screen.getByRole("progressbar", { name: "Coverage" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );

    rerender(<Progress value={-10} label="Coverage" />);
    expect(screen.getByRole("progressbar", { name: "Coverage" })).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });
});
