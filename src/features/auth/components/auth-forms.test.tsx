import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/server/actions", () => ({
  signInAction: vi.fn(async () => ({ status: "idle" })),
  signUpAction: vi.fn(async () => ({ status: "idle" })),
  forgotPasswordAction: vi.fn(async () => ({ status: "idle" })),
  resetPasswordAction: vi.fn(async () => ({ status: "idle" })),
  changePasswordAction: vi.fn(async () => ({ status: "idle" })),
  resendConfirmationAction: vi.fn(async () => ({ status: "idle" })),
}));

import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { FormMessage } from "@/features/auth/components/form-message";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import * as actions from "@/features/auth/server/actions";

describe("SignInForm", () => {
  it("associates labels, preserves the safe next path, and toggles the password", async () => {
    const user = userEvent.setup();
    render(<SignInForm next="/dashboard?tab=sources" />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.getByDisplayValue("/dashboard?tab=sources")).toHaveAttribute("type", "hidden");

    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("SignUpForm", () => {
  it("shows server-side field errors after submission", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.signUpAction).mockResolvedValueOnce({
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: { confirmPassword: "Passwords do not match." },
    });

    render(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "analytical-engine");
    await user.type(screen.getByLabelText("Confirm password"), "wrong-engine");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Check the highlighted fields");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("ChangePasswordForm", () => {
  it("labels the current and new password fields and surfaces a server error", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.changePasswordAction).mockResolvedValueOnce({
      status: "error",
      message: "Current password is incorrect.",
      fieldErrors: { currentPassword: "Current password is incorrect." },
    });

    render(<ChangePasswordForm />);

    expect(screen.getByLabelText("Current password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByLabelText("New password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Confirm new password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );

    await user.type(screen.getByLabelText("Current password"), "wrong-password");
    await user.type(screen.getByLabelText("New password"), "new-password-1");
    await user.type(screen.getByLabelText("Confirm new password"), "new-password-1");
    await user.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect.");
    expect(
      screen.getByText("Current password is incorrect.", {
        selector: "#change-current-password-error",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("FormMessage", () => {
  it("announces errors assertively and successes politely", () => {
    const { rerender } = render(<FormMessage tone="error">That did not work.</FormMessage>);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("That did not work.");
    expect(alert).toHaveAttribute("aria-live", "assertive");

    rerender(<FormMessage tone="success">That worked.</FormMessage>);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("That worked.");
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
