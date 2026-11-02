import { type NextRequest, NextResponse } from "next/server";

import { exchangeAuthCallbackCode } from "@/features/auth/server/callback";
import { sanitizeRedirectPath } from "@/lib/auth/redirects";
import { DEFAULT_AUTHENTICATED_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";

function failureResponse(request: NextRequest, errorCode: string | null): NextResponse {
  const signInUrl = new URL(SIGN_IN_PATH, request.nextUrl.origin);
  const error =
    errorCode === "otp_expired"
      ? "expired-link"
      : errorCode === "auth_unavailable"
        ? "auth-unavailable"
        : "invalid-link";
  signInUrl.searchParams.set("error", error);

  const response = NextResponse.redirect(signInUrl);
  response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
  return response;
}

/**
 * Handles Supabase email links (sign-up confirmation and password recovery).
 *
 * Supabase redirects here with a PKCE `code`. We exchange it for a session and
 * then forward to a sanitized, same-origin path.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const nextPath = sanitizeRedirectPath(params.get("next"), DEFAULT_AUTHENTICATED_PATH, {
    allowResetPassword: true,
  });

  // Supabase may return an error directly instead of a code.
  if (params.has("error")) {
    return failureResponse(request, params.get("error_code") ?? params.get("error"));
  }

  if (!code) {
    return failureResponse(request, null);
  }

  const result = await exchangeAuthCallbackCode(request, code, nextPath);

  if (!result.ok) {
    return failureResponse(request, result.errorCode);
  }

  return result.response;
}
