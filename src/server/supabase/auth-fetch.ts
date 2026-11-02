import "server-only";

/** Bound Supabase Auth calls so a stalled provider cannot hang a request. */
const AUTH_REQUEST_TIMEOUT_MS = 10_000;

/**
 * `fetch` wrapper for server-side Supabase clients.
 *
 * Supabase converts aborted requests into auth errors, which callers already
 * treat as unauthenticated or retryable. A timeout is preferable to an
 * indefinitely pending render, Server Action, or proxy request.
 *
 * Deliberately no automatic retries: sign-up and recovery requests are not
 * idempotent, and a retry could create duplicate users or emails.
 */
export function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, controller.signal])
    : controller.signal;

  return fetch(input, { ...init, signal }).finally(() => clearTimeout(timeout));
}
