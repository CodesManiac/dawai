export type AuthErrorContext =
  | "signIn"
  | "signUp"
  | "forgotPassword"
  | "resetPassword"
  | "changePassword"
  | "resendConfirmation"
  | "signOut";

const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "over_sms_send_rate_limit",
  "rate_limit_exceeded",
]);

const EXPIRED_LINK_CODES = new Set(["otp_expired", "bad_code_verifier", "flow_state_expired"]);

const CONTEXT_FALLBACK: Record<AuthErrorContext, string> = {
  signIn: "We couldn't sign you in. Check your details and try again.",
  signUp: "We couldn't create your account. Check your details and try again.",
  forgotPassword: "We couldn't send a reset email right now. Try again in a moment.",
  resetPassword: "We couldn't update your password. Request a new reset link.",
  changePassword: "We couldn't update your password. Try again.",
  resendConfirmation: "We couldn't send that email right now. Try again in a moment.",
  signOut: "We couldn't sign you out. Refresh the page and try again.",
};

export function isRateLimitError(error: { code?: string | null } | null | undefined): boolean {
  return Boolean(error?.code && RATE_LIMIT_CODES.has(error.code));
}

/**
 * Map a Supabase auth error to a user-facing message.
 *
 * Raw provider messages are never forwarded: they can vary by backend version
 * and some of them disclose whether an account exists. Codes are the stable
 * contract; unknown errors get a calm, context-specific fallback.
 */
export function mapAuthError(
  error: { code?: string | null } | null | undefined,
  context: AuthErrorContext,
): string {
  const code = error?.code;

  if (code && RATE_LIMIT_CODES.has(code)) {
    return "Too many attempts. Wait a minute, then try again.";
  }

  if (code && EXPIRED_LINK_CODES.has(code)) {
    return "That link has expired or was already used. Request a new one.";
  }

  switch (code) {
    case "invalid_credentials":
      return "Email or password is incorrect.";
    case "email_not_confirmed":
      return "Confirm your email address before signing in. Check your inbox for the link.";
    case "user_banned":
      return "This account is unavailable. Contact support if you think this is a mistake.";
    case "signup_disabled":
      return "New account creation is currently disabled.";
    case "user_already_exists":
    case "email_exists":
      return "If that email can be used, we've sent the next step. Try signing in or resetting your password.";
    case "weak_password":
      return "Choose a stronger password. Use at least 8 characters.";
    case "same_password":
      return "Choose a password you haven't used before.";
    case "session_not_found":
    case "session_expired":
    case "refresh_token_not_found":
    case "bad_jwt":
      return "Your session expired. Sign in again.";
    case "email_address_invalid":
    case "validation_failed":
      return "Check the details you entered and try again.";
    case "email_address_not_authorized":
      return "This email address can't receive messages right now. Try another address.";
    default:
      return CONTEXT_FALLBACK[context];
  }
}
