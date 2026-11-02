import "server-only";

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured, getSupabasePublicConfig } from "@/lib/supabase/config";
import { authFetch } from "@/server/supabase/auth-fetch";

export type CallbackExchangeResult =
  { ok: true; response: NextResponse } | { ok: false; errorCode: string | null };

/**
 * Exchange a PKCE auth code for a session and return a redirect response that
 * carries the session cookies and no-store headers.
 *
 * Used by `/auth/callback` for email confirmation and password recovery links.
 * A distinct client is required because the cookies must be written onto the
 * redirect response itself.
 */
export async function exchangeAuthCallbackCode(
  request: NextRequest,
  code: string,
  nextPath: string,
): Promise<CallbackExchangeResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, errorCode: "not_configured" };
  }

  const { url, publishableKey } = getSupabasePublicConfig();
  const response = NextResponse.redirect(new URL(nextPath, request.nextUrl.origin));

  const supabase = createServerClient(url, publishableKey, {
    global: { fetch: authFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  let errorCode: string | null = null;

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    errorCode = error?.code ?? null;
  } catch {
    // Timeout or network failure: show the same recoverable link error rather
    // than a 500 page.
    return { ok: false, errorCode: "auth_unavailable" };
  }

  if (errorCode) {
    return { ok: false, errorCode };
  }

  response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");

  return { ok: true, response };
}
