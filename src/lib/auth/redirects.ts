import {
  DEFAULT_AUTHENTICATED_PATH,
  isNonRedirectTarget,
  RESET_PASSWORD_PATH,
} from "@/lib/auth/routes";

const MAX_REDIRECT_LENGTH = 2048;
const SAFE_BASE = "https://dawai.invalid";
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const ENCODED_SEPARATORS = /%(?:2f|5c)/i;

/**
 * Decode a bounded number of times and reject anything that becomes an
 * absolute/protocol-relative path, a backslash path, or another encoded
 * separator. Some proxies normalize `Location` more than once; checking only
 * the raw path leaves a double-encoding bypass.
 */
function hasUnsafeEncoding(pathname: string): boolean {
  let current = pathname;

  for (let depth = 0; depth < 3; depth += 1) {
    if (
      ENCODED_SEPARATORS.test(current) ||
      current.includes("\\") ||
      CONTROL_CHARACTERS.test(current)
    ) {
      return true;
    }

    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return true;
    }

    if (decoded === current) {
      return false;
    }

    current = decoded;

    if (!current.startsWith("/") || current.startsWith("//")) {
      return true;
    }

    try {
      const parsed = new URL(current, SAFE_BASE);
      if (parsed.origin !== SAFE_BASE) {
        return true;
      }

      const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      if (!normalized.startsWith("/") || normalized.startsWith("//")) {
        return true;
      }
    } catch {
      return true;
    }
  }

  // More encoding layers than any legitimate destination needs.
  return true;
}

type SanitizeRedirectOptions = {
  /**
   * The email callback must be able to land on the recovery screen after it
   * exchanges the recovery code. Ordinary post-login destinations still reject
   * every auth screen.
   */
  allowResetPassword?: boolean;
};

/**
 * Normalize a user-supplied post-authentication destination.
 *
 * Only same-origin, absolute *paths* are accepted. Anything that could become
 * an open redirect (absolute URLs, protocol-relative URLs, backslash tricks,
 * control characters) resolves to `fallback`. Auth screens themselves are also
 * rejected so a successful sign-in can never bounce back to a guest-only page.
 *
 * `allowResetPassword` is a narrow exception used only by the email callback,
 * which has already exchanged a PKCE code and must forward recovery sessions to
 * `/reset-password`.
 */
export function sanitizeRedirectPath(
  input: unknown,
  fallback: string = DEFAULT_AUTHENTICATED_PATH,
  options: SanitizeRedirectOptions = {},
): string {
  if (typeof input !== "string") {
    return fallback;
  }

  const candidate = input.trim();

  if (
    candidate.length === 0 ||
    candidate.length > MAX_REDIRECT_LENGTH ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    CONTROL_CHARACTERS.test(candidate)
  ) {
    return fallback;
  }

  let url: URL;
  try {
    url = new URL(candidate, SAFE_BASE);
  } catch {
    return fallback;
  }

  if (url.origin !== SAFE_BASE) {
    return fallback;
  }

  // Dot-segment normalization can turn `/..//evil.example` into `//evil.example`.
  // Re-check after parsing so a protocol-relative path can never escape.
  const normalized = `${url.pathname}${url.search}${url.hash}`;
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return fallback;
  }

  // Some proxies decode escaped separators before forwarding `Location`.
  // Reject them in the path rather than relying on every hop to preserve them.
  if (hasUnsafeEncoding(url.pathname)) {
    return fallback;
  }

  const isAllowedRecoveryDestination =
    options.allowResetPassword === true && url.pathname === RESET_PASSWORD_PATH;

  if (isNonRedirectTarget(url.pathname) && !isAllowedRecoveryDestination) {
    return fallback;
  }

  return normalized;
}
