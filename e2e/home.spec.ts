import { expect, test } from "@playwright/test";

test.describe("foundation site", () => {
  test("home presents the foundation honestly", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Dawai/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Turn any source into understanding.",
    );
    await expect(page.getByText("Learning database · Task 003").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /The foundation is in place/ })).toBeVisible();
  });

  test("primary navigation reaches the design system", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("navigation", { name: "Primary" })
      .getByRole("link", { name: "Design system" })
      .click();

    await expect(page).toHaveURL(/\/design-system$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Foundations for focus.");
    await expect(page.getByText("#8E05C2").first()).toBeVisible();
  });

  test("the skip link is the first focus stop", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to content" });
    await expect(skipLink).toBeFocused();

    await skipLink.press("Enter");

    await expect(page).toHaveURL(/#main-content$/);
    await expect(page.locator("#main-content")).toBeVisible();
  });
});
