/**
 * Public Supabase configuration.
 *
 * Only browser-safe values live here. The publishable key is designed to be
 * shipped to the client; a secret or service-role key must never appear in a
 * `NEXT_PUBLIC_*` variable. This module has no side effects so it is safe to
 * import from both server and client modules.
 */

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export const SUPABASE_ENV_URL = "NEXT_PUBLIC_SUPABASE_URL";
export const SUPABASE_ENV_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

const SETUP_HINT = "Add them to .env.local (see .env.example) and restart the development server.";

function readJwtRole(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const parsed: unknown = JSON.parse(atob(padded));

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "role" in parsed &&
      typeof parsed.role === "string"
    ) {
      return parsed.role;
    }
  } catch {
    return null;
  }

  return null;
}

function assertBrowserSafeKey(publishableKey: string): void {
  if (publishableKey.startsWith("sb_secret_") || readJwtRole(publishableKey) === "service_role") {
    throw new SupabaseConfigurationError(
      `${SUPABASE_ENV_KEY} contains a secret key. Use the project's publishable (or legacy anon) key instead; secret keys must never be exposed to the browser.`,
    );
  }
}

/**
 * Read and validate the public Supabase configuration.
 *
 * Throws `SupabaseConfigurationError` with an actionable message. Call
 * `isSupabaseConfigured()` first when the caller wants to render a setup
 * notice rather than fail.
 */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  // Static member access is required so Next.js can inline these values in
  // client bundles; `process.env[name]` would be undefined in the browser.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  const missing = [
    ...(url ? [] : [SUPABASE_ENV_URL]),
    ...(publishableKey ? [] : [SUPABASE_ENV_KEY]),
  ];

  if (missing.length > 0) {
    throw new SupabaseConfigurationError(
      `Supabase authentication is not configured. Missing ${missing.join(" and ")}. ${SETUP_HINT}`,
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new SupabaseConfigurationError(
      `${SUPABASE_ENV_URL} must be an absolute URL, for example https://your-project.supabase.co. ${SETUP_HINT}`,
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new SupabaseConfigurationError(
      `${SUPABASE_ENV_URL} must use http or https (received "${parsedUrl.protocol}"). ${SETUP_HINT}`,
    );
  }

  assertBrowserSafeKey(publishableKey);

  return {
    url: parsedUrl.origin,
    publishableKey,
  };
}

export function isSupabaseConfigured(): boolean {
  try {
    getSupabasePublicConfig();
    return true;
  } catch {
    return false;
  }
}

/** Actionable, non-secret guidance shown when configuration is missing. */
export function getSupabaseConfigurationHelp(): string {
  try {
    getSupabasePublicConfig();
    return "";
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return error.message;
    }
    return `Supabase authentication is not configured. ${SETUP_HINT}`;
  }
}
