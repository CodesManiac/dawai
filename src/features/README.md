# Features

Feature-first vertical slices. A feature owns one user capability end to end and
exposes a deliberately small public API.

```
src/features/<feature>/
├── components/   # UI scoped to this feature (server by default)
├── lib/          # client-safe helpers owned by the feature
├── server/       # server actions, use cases, orchestration
├── schemas/      # input/output validation
├── types.ts      # domain types owned by the feature
└── index.ts      # client-safe public exports only
```

## Current slice: `auth`

`src/features/auth` is the reference implementation for later features:

- `components/` contains the auth screens, form primitives, and status messages.
- `schemas/` validates every form with zod before Supabase is called.
- `server/actions.ts` owns sign-in, sign-up, sign-out, recovery, reset,
  authenticated password change, and resend mutations.
- `server/session.ts` exposes `getCurrentUser()`, `requireUser()`, and
  `getRecoveryAuthorization()`. Reset authorization requires a recent Supabase
  `amr` recovery claim; an ordinary session is not enough.
- `server/callback.ts` exchanges PKCE codes for sessions.
- `lib/browser-client.ts` is the browser Supabase factory for future
  client-side reads and realtime. Auth writes stay in Server Actions.
- `index.ts` exports only client-safe components and types.

## Rules

- Routes in `src/app` compose features; they do not contain business logic.
- Import another feature through its `index.ts`, never by reaching into its
  internals.
- Keep server-only code out of the public `index.ts`. Use `import "server-only"`
  in modules that must never reach the browser.
- Share a component through `src/components/ui` only when at least two features
  need it with the same semantics.
- Keep server-only code out of client bundles. Pass serializable data to client
  components.
- A feature is not "done" without tests for its business rules and an
  end-to-end path for its primary flow.
- Auth must remain server-authoritative: resolve identity with Supabase, never
  with a user ID supplied by the client. Sanitize every post-login redirect.

Task 003 adds profiles and the first learning schema only after approval. Do not
add study packs or learning tables to this slice in advance.
