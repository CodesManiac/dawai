import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renders a native button with variant classes", () => {
    render(
      <Button variant="secondary" size="lg">
        Start learning
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Start learning" });

    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("h-12", "bg-surface-elevated");
  });

  it("renders its child element when asChild is set", () => {
    render(
      <Button asChild variant="outline">
        <a href="/design-system">Design system</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Design system" });

    expect(link).toHaveAttribute("href", "/design-system");
    expect(link).toHaveClass("border-border-strong");
  });

  it("supports the disabled state", () => {
    render(<Button disabled>Unavailable</Button>);

    expect(screen.getByRole("button", { name: "Unavailable" })).toBeDisabled();
  });
});
