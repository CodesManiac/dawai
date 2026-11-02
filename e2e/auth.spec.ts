import { expect, test, type Page } from "@playwright/test";

const SIGN_IN_HEADING = "Sign in to Dawai";

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });

  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("protected routes", () => {
  test("guests are redirected to sign-in and keep the intended destination", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard$/);
    await expect(page.getByRole("heading", { level: 1, name: SIGN_IN_HEADING })).toBeVisible();
  });

  test("the account password page is protected too", async ({ page }) => {
    await page.goto("/account/password");

    await expect(page).toHaveURL(/\/sign-in\?next=%2Faccount%2Fpassword$/);
    await expect(page.getByRole("heading", { level: 1, name: SIGN_IN_HEADING })).toBeVisible();
  });

  test("an unsafe next parameter is not reflected into a redirect", async ({ page }) => {
    await page.goto("/sign-in?next=https%3A%2F%2Fevil.example%2Fsteal");

    // The form keeps the sanitized value, so a successful sign-in cannot leave
    // the site. The hidden input is the value the server action receives.
    await expect(page.locator('input[name="next"]')).toHaveValue("/dashboard");
  });
});

test.describe("authentication forms", () => {
  test("sign-in has labelled fields and keyboard-operable password visibility", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    const email = page.getByLabel("Email");
    const password = page.getByLabel("Password", { exact: true });

    await expect(email).toHaveAttribute("autocomplete", "email");
    await expect(password).toHaveAttribute("type", "password");

    await password.focus();
    await page.keyboard.press("Tab");
    const toggle = page.getByRole("button", { name: "Show password" });
    await expect(toggle).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(password).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("invalid credentials return the generic live error", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.invalid`);
    await page.getByLabel("Password", { exact: true }).fill("not-the-right-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Email or password is incorrect." }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("sign-up rejects mismatched passwords without creating an account", async ({ page }) => {
    await page.goto("/sign-up");

    await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.invalid`);
    await page.getByLabel("Password", { exact: true }).fill("analytical-engine");
    await page.getByLabel("Confirm password").fill("different-engine");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Passwords do not match.")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-up/);
  });

  test("password recovery does not reveal whether an account exists", async ({ page }) => {
    await page.goto("/forgot-password");

    await page.getByLabel("Email").fill(`e2e-missing-${Date.now()}@example.invalid`);
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByRole("status")).toContainText("If an account exists for that email", {
      timeout: 20_000,
    });
    await expect(page.getByText(/password reset link is on its way/i)).toBeVisible();
  });

  test("an invalid confirmation code returns to sign-in with a recoverable error", async ({
    page,
  }) => {
    await page.goto("/auth/callback?code=not-a-real-code&next=%2Fdashboard");

    await expect(page).toHaveURL(/\/sign-in\?error=invalid-link/);
    await expect(page.getByRole("alert").filter({ hasText: "That link is invalid" })).toBeVisible();
  });

  test("the reset form is unavailable without a recovery session", async ({ page }) => {
    await page.goto("/reset-password");

    await expect(
      page.getByRole("heading", { level: 1, name: "Choose a new password" }),
    ).toBeVisible();
    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();
    await expect(page.getByLabel("New password")).toHaveCount(0);
  });
});

test.describe("responsive auth screens", () => {
  for (const width of [320, 390, 768, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });

      for (const path of [
        "/sign-in",
        "/sign-up",
        "/forgot-password",
        "/reset-password",
        "/confirm-email",
      ]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await assertNoHorizontalOverflow(page);
      }
    });
  }
});
