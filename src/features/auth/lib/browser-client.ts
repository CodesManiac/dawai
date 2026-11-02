import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "@/lib/supabase/config";

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;

let browserClient: BrowserSupabaseClient | undefined;

/**
 * Browser-side Supabase client for auth-aware client components.
 *
 * Session cookies are shared with the server client, so reads here stay
 * consistent with Server Components. Writes (sign-in, sign-up, password
 * changes) go through Server Actions so they are validated on the server;
 * this factory exists for client-side queries, realtime, and auth-state
 * listeners as those features land.
 */
export function createBrowserSupabaseClient(): BrowserSupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const { url, publishableKey } = getSupabasePublicConfig();
  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}
