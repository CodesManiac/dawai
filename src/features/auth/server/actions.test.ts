import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  clearSupabaseAuthCookies: vi.fn().mockResolvedValue(true),
  getCurrentUser: vi.fn(),
  getRecoveryAuthorization: vi.fn(),
}));

vi.mock("@/server/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
  clearSupabaseAuthCookies: mocks.clearSupabaseAuthCookies,
}));

vi.mock("@/features/auth/server/session", () => ({
  getCurrentUser: mocks.getCurrentUser,
  getRecoveryAuthorization: mocks.getRecoveryAuthorization,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  changePasswordAction,
  forgotPasswordAction,
  resendConfirmationAction,
  resetPasswordAction,
  signInAction,
  signOutAction,
  signUpAction,
} from "@/features/auth/server/actions";
import { createInitialAuthState, type AuthActionState } from "@/features/auth/types";

const VALID_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project-ref.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
} as const;

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }
  return data;
}

function credentials(overrides: Record<string, string> = {}) {
  return {
    email: "reader@example.com",
    password: "correct horse battery",
    ...overrides,
  };
}

function authClient() {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-1" }, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      resend: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  };
}

function useClient(client: ReturnType<typeof authClient>) {
  mocks.createSupabaseServerClient.mockResolvedValue(client as never);
  return client;
}

async function run(
  action: (state: AuthActionState, data: FormData) => Promise<AuthActionState>,
  data: FormData,
): Promise<AuthActionState> {
  return action(createInitialAuthState(), data);
}

describe("signInAction", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      VALID_ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects invalid input before touching Supabase", async () => {
    const state = await run(signInAction, form({ email: "nope", password: "" }));

    expect(state.status).toBe("error");
    expect(state.fieldErrors?.email).toMatch(/valid email/i);
    expect(state.fieldErrors?.password).toMatch(/enter your password/i);
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns a generic error for wrong credentials", async () => {
    const client = useClient(authClient());
    client.auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: "invalid_credentials", status: 400 },
    });

    const state = await run(signInAction, form(credentials({ next: "/dashboard" })));

    expect(state).toEqual({ status: "error", message: "Email or password is incorrect." });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to a safe next path after a successful sign-in", async () => {
    const client = useClient(authClient());

    await expect(
      run(signInAction, form(credentials({ next: "/dashboard?tab=sources" }))),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "reader@example.com",
      password: "correct horse battery",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(redirect).toHaveBeenCalledWith("/dashboard?tab=sources");
  });

  it("ignores an open-redirect attempt after successful sign-in", async () => {
    useClient(authClient());

    await expect(
      run(signInAction, form(credentials({ next: "https://evil.example/steal" }))),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("explains missing configuration without calling Supabase", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const state = await run(signInAction, form(credentials()));

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(state.message).toMatch(/\.env\.local/);
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });
});

describe("signUpAction", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      VALID_ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects mismatched passwords without creating an account", async () => {
    const state = await run(
      signUpAction,
      form({ email: "ada@example.com", password: "analytical-engine", confirmPassword: "wrong" }),
    );

    expect(state.status).toBe("error");
    expect(state.fieldErrors?.confirmPassword).toBe("Passwords do not match.");
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns a confirmation state when email confirmation is enabled", async () => {
    const client = useClient(authClient());

    const state = await run(
      signUpAction,
      form({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        password: "analytical-engine",
        confirmPassword: "analytical-engine",
      }),
    );

    expect(state.status).toBe("success");
    expect(state.submittedEmail).toBe("ada@example.com");
    expect(state.message).toMatch(/confirm your email/i);
    expect(client.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "ada@example.com",
        password: "analytical-engine",
        options: expect.objectContaining({
          data: { full_name: "Ada Lovelace" },
          emailRedirectTo: expect.stringContaining("/auth/callback?next=%2Fdashboard"),
        }),
      }),
    );
  });

  it("redirects when confirmation is disabled and a session is returned", async () => {
    const client = useClient(authClient());
    client.auth.signUp.mockResolvedValue({
      data: { user: { id: "user-1" }, session: { access_token: "session-token" } },
      error: null,
    });

    await expect(
      run(
        signUpAction,
        form({
          email: "ada@example.com",
          password: "analytical-engine",
          confirmPassword: "analytical-engine",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/dashboard?notice=welcome");
  });

  it("does not reveal that an email is already registered", async () => {
    const client = useClient(authClient());
    client.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { code: "user_already_exists", status: 422 },
    });

    const state = await run(
      signUpAction,
      form({
        email: "ada@example.com",
        password: "analytical-engine",
        confirmPassword: "analytical-engine",
      }),
    );

    expect(state.status).toBe("error");
    expect(state.message).not.toMatch(/already exists/i);
  });
});

describe("forgotPasswordAction", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      VALID_ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("responds the same way when the provider reports an unknown account", async () => {
    const client = useClient(authClient());
    client.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { code: "user_not_found", status: 404 },
    });

    const state = await run(forgotPasswordAction, form({ email: "nobody@example.com" }));

    expect(state.status).toBe("success");
    expect(state.message).toMatch(/If an account exists/);
  });

  it("sends recovery links through the callback to the reset page", async () => {
    const client = useClient(authClient());

    const state = await run(forgotPasswordAction, form({ email: "reader@example.com" }));

    expect(state.status).toBe("success");
    expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith("reader@example.com", {
      redirectTo: expect.stringContaining("/auth/callback?next=%2Freset-password"),
    });
  });

  it("surfaces rate limits because they are actionable", async () => {
    const client = useClient(authClient());
    client.auth.resetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { code: "over_email_send_rate_limit", status: 429 },
    });

    const state = await run(forgotPasswordAction, form({ email: "reader@example.com" }));

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/Too many attempts/);
  });
});

describe("resetPasswordAction", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      VALID_ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("rejects when the session did not come from a recovery link", async () => {
    mocks.getRecoveryAuthorization.mockResolvedValue(null);

    const state = await run(
      resetPasswordAction,
      form({ password: "new-password-1", confirmPassword: "new-password-1" }),
    );

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/invalid or has expired/i);
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("updates the password, revokes every session, and sends the user to sign in", async () => {
    mocks.getRecoveryAuthorization.mockResolvedValue({ user: { id: "user-1" } });
    const client = useClient(authClient());

    await expect(
      run(
        resetPasswordAction,
        form({ password: "new-password-1", confirmPassword: "new-password-1" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(client.auth.updateUser).toHaveBeenCalledWith({ password: "new-password-1" });
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(mocks.clearSupabaseAuthCookies).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/sign-in?notice=password-updated");
  });

  it("clears the local session and reports a partial result when global revocation fails", async () => {
    mocks.getRecoveryAuthorization.mockResolvedValue({ user: { id: "user-1" } });
    const client = useClient(authClient());
    client.auth.signOut.mockResolvedValue({ error: { code: "unexpected_failure" } });

    await expect(
      run(
        resetPasswordAction,
        form({ password: "new-password-1", confirmPassword: "new-password-1" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(client.auth.signOut).toHaveBeenCalledTimes(1);
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(mocks.clearSupabaseAuthCookies).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/sign-in?notice=password-updated-partial");
  });

  it("still clears the local session when the global sign-out request throws", async () => {
    mocks.getRecoveryAuthorization.mockResolvedValue({ user: { id: "user-1" } });
    const client = useClient(authClient());
    client.auth.signOut.mockRejectedValueOnce(new Error("network down"));

    await expect(
      run(
        resetPasswordAction,
        form({ password: "new-password-1", confirmPassword: "new-password-1" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(client.auth.signOut).toHaveBeenCalledTimes(1);
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(mocks.clearSupabaseAuthCookies).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/sign-in?notice=password-updated-partial");
  });
});

describe("changePasswordAction", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      VALID_ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("requires a server-verified user with an email", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    const state = await run(
      changePasswordAction,
      form({
        currentPassword: "old-password-1",
        password: "new-password-1",
        confirmPassword: "new-password-1",
      }),
    );

    expect(state.status).toBe("error");
    expect(state.message).toMatch(/session has expired/i);
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("rejects a wrong current password without changing the password", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "reader@example.com" });
    const client = useClient(authClient());
    client.auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: "invalid_credentials", status: 400 },
    });

    const state = await run(
      changePasswordAction,
      form({
        currentPassword: "wrong-password",
        password: "new-password-1",
        confirmPassword: "new-password-1",
      }),
    );

    expect(state.status).toBe("error");
    expect(state.message).toBe("Current password is incorrect.");
    expect(state.fieldErrors?.currentPassword).toBe("Current password is incorrect.");
    expect(client.auth.updateUser).not.toHaveBeenCalled();
    expect(client.auth.signOut).not.toHaveBeenCalled();
  });

  it("re-authenticates, updates the password, and revokes other sessions", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "reader@example.com" });
    const client = useClient(authClient());

    await expect(
      run(
        changePasswordAction,
        form({
          currentPassword: "old-password-1",
          password: "new-password-1",
          confirmPassword: "new-password-1",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "reader@example.com",
      password: "old-password-1",
    });
    expect(client.auth.updateUser).toHaveBeenCalledWith({ password: "new-password-1" });
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(redirect).toHaveBeenCalledWith("/account/password?notice=password-changed");
  });

  it("reports a partial result when other sessions cannot be revoked", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "reader@example.com" });
    const client = useClient(authClient());
    client.auth.signOut.mockResolvedValue({ error: { code: "unexpected_failure" } });

    await expect(
      run(
        changePasswordAction,
        form({
          currentPassword: "old-password-1",
          password: "new-password-1",
          confirmPassword: "new-password-1",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/account/password?notice=password-changed-partial");
  });

  it("reports a partial result when the other-session request throws", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "reader@example.com" });
    const client = useClient(authClient());
    client.auth.signOut.mockRejectedValueOnce(new Error("network down"));

    await expect(
      run(
        changePasswordAction,
        form({
          currentPassword: "old-password-1",
          password: "new-password-1",
          confirmPassword: "new-password-1",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(client.auth.updateUser).toHaveBeenCalledWith({ password: "new-password-1" });
    expect(redirect).toHaveBeenCalledWith("/account/password?notice=password-changed-partial");
  });
});

describe("signOutAction", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      VALID_ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("clears the session and redirects", async () => {
    const client = useClient(authClient());

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT");

    expect(client.auth.signOut).toHaveBeenCalled();
    expect(mocks.clearSupabaseAuthCookies).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/sign-in?notice=signed-out");
  });

  it("reports a partial result when Supabase is unreachable", async () => {
    mocks.createSupabaseServerClient.mockRejectedValue(new Error("network down"));

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT");

    expect(mocks.clearSupabaseAuthCookies).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/sign-in?notice=signed-out-partial");
  });

  it("clears the local session and reports partial when the global request fails", async () => {
    const client = useClient(authClient());
    client.auth.signOut.mockRejectedValueOnce(new Error("network down"));

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT");

    expect(client.auth.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.clearSupabaseAuthCookies).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/sign-in?notice=signed-out-partial");
  });

  it("falls back to a local clear when global sign-out returns an error", async () => {
    const client = useClient(authClient());
    client.auth.signOut.mockResolvedValueOnce({ error: { code: "unexpected_failure" } });

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT");

    expect(client.auth.signOut).toHaveBeenCalledTimes(1);
    expect(mocks.clearSupabaseAuthCookies).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/sign-in?notice=signed-out-partial");
  });
});

describe("resendConfirmationAction", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      VALID_ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns a generic success even when the address is unknown", async () => {
    const client = useClient(authClient());
    client.auth.resend.mockResolvedValue({
      data: {},
      error: { code: "user_not_found", status: 404 },
    });

    const state = await run(resendConfirmationAction, form({ email: "nobody@example.com" }));

    expect(state.status).toBe("success");
    expect(state.message).toMatch(/If that address is waiting/);
  });
});
