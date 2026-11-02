import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";

import { sanitizeRedirectPath } from "@/lib/auth/redirects";
import { DEFAULT_AUTHENTICATED_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Resolve the authenticated user for the current request.
 *
 * `auth.getUser()` validates the access token against Supabase Auth instead of
 * trusting cookie contents, so a forged or stale session cannot be used to read
 * protected data. `cache()` deduplicates the call within a single render.
 *
 * Returns `null` when unconfigured, unauthenticated, or when the auth service is
 * unreachable; callers decide whether to redirect or render a guest state.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
});

/**
 * Require a session for a page or layout. Redirects to sign-in with a
 * sanitized return path. Never accept a user ID from the client.
 */
export async function requireUser(nextPath?: string): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    const safeNext = sanitizeRedirectPath(nextPath, DEFAULT_AUTHENTICATED_PATH);
    const params = new URLSearchParams({ next: safeNext });
    redirect(`${SIGN_IN_PATH}?${params.toString()}`);
  }

  return user;
}

/** A recovery link is only useful for a bounded window after it is opened. */
export const RECOVERY_AUTHORIZATION_MAX_AGE_MS = 60 * 60 * 1000;

/** Tolerate small clock differences between the app host and Supabase. */
const RECOVERY_CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Read the most recent `recovery` timestamp from Supabase's signed JWT `amr`
 * claim. A recovery link establishes a session with the `recovery` method; an
 * ordinary password sign-in does not.
 *
 * The detailed `{ method, timestamp }` form is required for authorization
 * because it lets us enforce recency. A string-only claim is recognized as a
 * recovery method but returns `null` here: without a timestamp the app cannot
 * distinguish a fresh recovery session from a stale one, so it fails closed.
 */
export function getRecoveryAuthenticationTimestamp(amr: unknown): number | null {
  if (!Array.isArray(amr)) {
    return null;
  }

  let latestTimestamp: number | null = null;

  for (const entry of amr) {
    if (typeof entry !== "object" || entry === null || !("method" in entry)) {
      continue;
    }

    const candidate = entry as { method?: unknown; timestamp?: unknown };

    if (candidate.method !== "recovery") {
      continue;
    }

    if (typeof candidate.timestamp !== "number" || !Number.isFinite(candidate.timestamp)) {
      return null;
    }

    latestTimestamp = Math.max(latestTimestamp ?? 0, candidate.timestamp);
  }

  return latestTimestamp;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Return the current user only when their server-verified session was created
 * by a password-recovery link.
 *
 * `getClaims()` validates the JWT signature and expiry (falling back to
 * `getUser()` for symmetric signing keys), so the `amr` value comes from
 * Supabase rather than a client-controlled flag or cookie. `getUser()` is still
 * called first so a revoked session cannot authorize a password reset.
 *
 * Recovery authorization is deliberately fail-closed: an unavailable auth
 * service, a missing claim, a string-only claim without a timestamp, or a
 * recovery session older than `RECOVERY_AUTHORIZATION_MAX_AGE_MS` returns
 * `null`.
 */
export const getRecoveryAuthorization = cache(async (): Promise<{ user: User } | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const claims: unknown = claimsData?.claims;

    if (claimsError || !isRecord(claims) || claims.sub !== user.id) {
      return null;
    }

    const recoveryTimestamp = getRecoveryAuthenticationTimestamp(claims.amr);

    if (recoveryTimestamp === null) {
      return null;
    }

    const ageMs = Date.now() - recoveryTimestamp * 1000;

    if (ageMs < -RECOVERY_CLOCK_SKEW_MS || ageMs > RECOVERY_AUTHORIZATION_MAX_AGE_MS) {
      return null;
    }

    return { user };
  } catch {
    return null;
  }
});
