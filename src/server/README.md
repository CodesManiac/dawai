# Server capabilities

Cross-feature, server-only code lives here. Nothing in this directory may import
React, `src/app`, `src/components`, or `src/features`.

| Folder       | Responsibility                                            | Task 003 state                |
| ------------ | --------------------------------------------------------- | ----------------------------- |
| `ai/`        | Model-agnostic provider contracts and future adapters     | Contract only                 |
| `documents/` | Extraction, chunking, citation locators, future pipelines | Contract only                 |
| `db/`        | Repository contracts, validation, learning data access    | Implemented for learning data |
| `supabase/`  | Cookie-bound Supabase clients and proxy session refresh   | Implemented for auth and data |

## Rules

1. Never expose provider keys, the service-role key, or raw database clients to
   the browser. Only the Supabase publishable/legacy anon key may be public.
2. Features depend on contracts from this layer through server actions or
   server components. Client components receive plain data.
3. Add a folder here only when at least two features need the capability.
   Otherwise keep it inside the owning feature.
4. Keep vendor SDK imports inside adapters (`ai/`, `db/`, `supabase/`) so the
   rest of the codebase stays portable.
5. Create Supabase clients per request. Never cache a client or auth session in
   module scope; cookies carry the session.

`src/server/supabase/server.ts` serves Server Components, Server Actions, and
Route Handlers. It also exposes `clearSupabaseAuthCookies()` for failed sign-out
paths, so a provider outage cannot leave stale auth cookies rendering protected
pages. `proxy-session.ts` refreshes tokens for `src/proxy.ts` and writes the
resulting cookies onto the response. Protected layouts still validate the user
with `getCurrentUser()` / `requireUser()`; the proxy is not the authorization
boundary.

Task 003 implements the `profiles`, `courses`, `study_packs`, and `sources` schema with RLS,
column-scoped grants, same-owner foreign keys, and repositories in `db/`. Document upload, source
processing, retrieval, embeddings, and live AI calls remain explicitly deferred.
