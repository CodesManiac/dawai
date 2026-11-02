# Supabase server boundary

Cookie-bound Supabase clients for the App Router. This folder is server-only and
must not import React, routes, components, or features.

| File               | Responsibility                                                                |
| ------------------ | ----------------------------------------------------------------------------- |
| `auth-fetch.ts`    | Bound Supabase Auth requests with a 10-second abort timeout.                  |
| `server.ts`        | Request-scoped client plus `clearSupabaseAuthCookies()` for failed sign-outs. |
| `proxy-session.ts` | Refresh expired tokens and copy rotated cookies onto the proxy response.      |

## Request flow

1. `src/proxy.ts` calls `refreshSupabaseSession()` for matched navigations.
   `auth.getUser()` validates the access token and rotates the refresh token when
   needed. Refreshed cookies are written to both the request (for the current
   render) and the response (for the browser).
2. The `(app)` layout calls `requireUser()` from the auth feature. That helper
   creates a fresh server client and validates the identity again.
3. Server Actions use `createSupabaseServerClient()` for auth mutations and
   write session cookies through the action response.
4. `/auth/callback` uses a dedicated client in
   `src/features/auth/server/callback.ts` so session cookies are attached to the
   redirect itself.

## Rules

- Create a client per request. Never share one in module scope.
- Use the publishable/legacy anon key only. A service-role client needs explicit
  approval and must never be reachable from the browser.
- Treat `getUser()` as the identity check. Do not trust `getSession()` or decoded
  cookie claims for authorization.
- Do not log tokens, cookies, passwords, or raw provider errors.
- Keep the proxy optimistic. Protected layouts and pages must re-check the user;
  a proxy redirect is not an authorization boundary.
- Cookie writes from a Server Component are rejected by Next.js. The proxy
  performs refresh-and-write for render requests; Server Actions and Route
  Handlers can write cookies directly.

PKCE email links are browser-bound because the code verifier is stored in that
browser's cookies. Copy must tell users to open confirmation and recovery links
in the same browser that started the flow.
