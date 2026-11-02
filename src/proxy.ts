import { NextResponse, type NextRequest } from "next/server";

import {
  DEFAULT_AUTHENTICATED_PATH,
  isGuestOnlyPath,
  isProtectedPath,
  SIGN_IN_PATH,
} from "@/lib/auth/routes";
import { refreshSupabaseSession } from "@/server/supabase/proxy-session";

function redirectWithSessionCookies(url: URL, source: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(url);

  for (const cookie of source.cookies.getAll()) {
    redirect.cookies.set(cookie);
  }

  // Authenticated HTML must never be cached by a CDN or shared proxy.
  redirect.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");

  return redirect;
}

/**
 * Session refresh and coarse route protection.
 *
 * This is an optimistic gate that keeps navigation fast. The `(app)` layout and
 * pages re-validate the session on the server, so authorization never depends
 * on the proxy alone.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, user, configured } = await refreshSupabaseSession(request);

  if (!configured) {
    return response;
  }

  if (!user && isProtectedPath(pathname)) {
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = SIGN_IN_PATH;
    signInUrl.search = "";
    signInUrl.searchParams.set("next", `${pathname}${search}`);
    return redirectWithSessionCookies(signInUrl, response);
  }

  if (user && isGuestOnlyPath(pathname)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = DEFAULT_AUTHENTICATED_PATH;
    dashboardUrl.search = "";
    return redirectWithSessionCookies(dashboardUrl, response);
  }

  if (isProtectedPath(pathname)) {
    // Authenticated HTML must never be cached by a CDN or shared proxy.
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
