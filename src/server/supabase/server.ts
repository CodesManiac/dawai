import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabasePublicConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import { authFetch } from "@/server/supabase/auth-fetch";

export type SupabaseServerClient = ReturnType<typeof createServerClient>;

/**
 * Create a request-scoped Supabase client for Server Components, Server
 * Actions, and Route Handlers.
 *
 * A new client is created for every request: auth state lives in cookies, not
 * in module scope. Never cache or share the returned client.
 *
 * Cookie writes from a Server Component are rejected by Next.js. That is
 * expected: the proxy refreshes the session and writes the cookies there.
 */
export async function createSupabaseServerClient(): Promise<SupabaseServerClient> {
  const { url, publishableKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    global: { fetch: authFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component render: cookies are read-only. The proxy performs
          // the refresh-and-write on the same request.
        }
      },
    },
  });
}

/**
 * Remove Supabase auth cookies without making a network request.
 *
 * `auth.signOut({ scope: "local" })` still calls the logout endpoint in
 * auth-js. If the provider is unreachable, that call cannot reliably clear the
 * browser session. Server Actions use this helper after a failed sign-out so a
 * protected page cannot keep rendering from stale cookies.
 *
 * Returns `true` when no matching cookies remain (or none existed) and `false`
 * when a deletion failed. Callers should still report a partial sign-out when
 * global revocation could not be confirmed.
 */
export async function clearSupabaseAuthCookies(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { url } = getSupabasePublicConfig();
    const projectRef = new URL(url).hostname.split(".")[0];
    const storageKey = `sb-${projectRef}-auth-token`;
    const cookieStore = await cookies();
    let failed = false;

    for (const cookie of cookieStore.getAll()) {
      const isAuthCookie =
        cookie.name === storageKey ||
        cookie.name.startsWith(`${storageKey}.`) ||
        cookie.name.startsWith(`${storageKey}-`);

      if (!isAuthCookie) {
        continue;
      }

      try {
        cookieStore.delete(cookie.name);
      } catch {
        failed = true;
      }
    }

    return !failed;
  } catch {
    return false;
  }
}
