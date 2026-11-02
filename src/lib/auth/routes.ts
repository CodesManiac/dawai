/**
 * Auth routes and route-protection helpers.
 *
 * Shared by the proxy (optimistic redirects), layouts, and pages. The server
 * layout for `(app)` re-checks the session, so these helpers must never be
 * treated as the only authorization layer.
 */

export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
export const FORGOT_PASSWORD_PATH = "/forgot-password";
export const RESET_PASSWORD_PATH = "/reset-password";
export const CONFIRM_EMAIL_PATH = "/confirm-email";
export const AUTH_CALLBACK_PATH = "/auth/callback";
export const ACCOUNT_PASSWORD_PATH = "/account/password";

/** Where an authenticated user lands when no valid `next` path is available. */
export const DEFAULT_AUTHENTICATED_PATH = "/dashboard";

/** Pages that make no sense for an already-authenticated user. */
const GUEST_ONLY_PATHS = [SIGN_IN_PATH, SIGN_UP_PATH, FORGOT_PASSWORD_PATH] as const;

/** Auth routes that must never be used as a post-login redirect target. */
const NON_REDIRECT_TARGETS: readonly string[] = [
  ...GUEST_ONLY_PATHS,
  RESET_PASSWORD_PATH,
  CONFIRM_EMAIL_PATH,
  AUTH_CALLBACK_PATH,
];

/** Route prefixes that require a session. Keep in sync with `(app)` routes. */
const PROTECTED_PREFIXES = [DEFAULT_AUTHENTICATED_PATH, "/account"] as const;

function matchesPath(pathname: string, target: string): boolean {
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPath(pathname, prefix));
}

export function isGuestOnlyPath(pathname: string): boolean {
  return GUEST_ONLY_PATHS.some((path) => matchesPath(pathname, path));
}

export function isNonRedirectTarget(pathname: string): boolean {
  return NON_REDIRECT_TARGETS.some((path) => matchesPath(pathname, path));
}
