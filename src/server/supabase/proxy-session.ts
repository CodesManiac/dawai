import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabasePublicConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import { authFetch } from "@/server/supabase/auth-fetch";

type SessionRefreshResult = {
  response: NextResponse;
  user: User | null;
  configured: boolean;
};

/**
 * Refresh the Supabase session for a proxy request.
 *
 * `auth.getUser()` validates the access token with Supabase and triggers a
 * refresh when it has expired. Refreshed tokens are written to both the request
 * (so the current render sees them) and the response (so the browser keeps
 * them). Always run this before redirect decisions and before rendering.
 */
export async function refreshSupabaseSession(request: NextRequest): Promise<SessionRefreshResult> {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return { response, user: null, configured: false };
  }

  const { url, publishableKey } = getSupabasePublicConfig();

  const supabase = createServerClient(url, publishableKey, {
    global: { fetch: authFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }

        response = NextResponse.next({ request });

        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }

        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  let user: User | null = null;

  try {
    const {
      data: { user: verifiedUser },
      error,
    } = await supabase.auth.getUser();

    if (!error) {
      user = verifiedUser;
    }
  } catch {
    // A timeout or network failure is treated as a guest. Protected layouts
    // re-check and redirect rather than rendering stale content.
    user = null;
  }

  return { response, user, configured: true };
}
