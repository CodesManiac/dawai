# Dawai

Dawai is an AI-powered learning companion for documents, webpages, and educational video. The
product direction is source-grounded explanation, audio lessons, interactive tutoring, quizzes, and
personalized feedback.

> **Current state: Task 002 — Authentication foundation.** Email/password accounts, server-validated
> sessions, a protected dashboard, email confirmation, password recovery/reset, and authenticated
> password change are implemented with Supabase Auth. Learning features, application tables/migrations,
> live AI calls, uploads, retrieval, quizzes, and TTS are intentionally not implemented.

## What is in place

- Email/password sign-up, sign-in, sign-out, email confirmation, password recovery/reset, and an
  authenticated password-change flow.
- Server-validated sessions with Supabase SSR, PKCE callback handling, and cookie refresh in
  `src/proxy.ts`.
- A protected `(app)` route group whose layout re-checks the authenticated user on the server,
  including `/account/password`.
- Safe post-login redirects: absolute URLs, protocol-relative URLs, backslash tricks, dot-segment
  normalization, single- and double-encoded path separators, control characters, and auth screens
  are rejected.
- Auth screens built from the Dawai design system with visible labels, keyboard-operable password
  visibility, focus styles, live error/success regions, and no horizontal overflow at 320 px.
- A Next.js 16 App Router shell with strict TypeScript and route groups.
- A dark-first design system with semantic tokens, Montserrat UI type, and Source Serif 4 for
  learning content.
- Shared, accessible UI primitives in the shadcn/ui style: button, badge, card, input, progress.
- Feature-oriented boundaries for UI, business logic, database access, AI services, and document
  processing.
- Vitest + Testing Library for unit/component tests and Playwright for end-to-end tests.
- ESLint (including import-boundary rules), Prettier, EditorConfig, and security headers.
- Environment template, setup docs, and architecture rules in `AGENTS.md`.

## Requirements

- **Node.js 24.15 or newer** (`.nvmrc` pins 24). The test environment (`jsdom` 30) requires
  24.15+.
- **npm 11+** (the repository ships a `package-lock.json`; npm 12 was used for verification).
- A Supabase project with email authentication enabled for the auth flows.
- Network access on the first build so `next/font` can fetch and self-host the font files.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` before
using the auth screens. `NEXT_PUBLIC_APP_URL` falls back to `http://localhost:3000`; set it
explicitly in production so confirmation and recovery emails point at the right host.

Open [http://localhost:3000](http://localhost:3000). The auth entry points are `/sign-in`,
`/sign-up`, and `/forgot-password`. The design reference lives at
[http://localhost:3000/design-system](http://localhost:3000/design-system).

Without Supabase variables the public site still renders, but auth pages show a configuration
notice instead of forms. No credential is logged or rendered.

### Supabase dashboard setup

1. In **Project Settings → API**, copy the project URL and the **publishable** key
   (`sb_publishable_…`) into `.env.local`. Legacy anon JWTs also work. Never use a secret
   (`sb_secret_…`) or `service_role` JWT in a `NEXT_PUBLIC_*` variable.
2. In **Authentication → Providers → Email**, keep email enabled. Enable **Confirm email** for the
   confirmation flow. The app also handles projects where confirmation is disabled by signing the
   user in immediately after sign-up.
3. In **Authentication → URL Configuration**, set **Site URL** to `NEXT_PUBLIC_APP_URL` (for
   example `http://localhost:3000`) and add `${NEXT_PUBLIC_APP_URL}/auth/callback` to the redirect
   allow list. For local development, Supabase's suggested `http://localhost:3000/**` wildcard is
   also acceptable.
4. Review **Authentication → Rate Limits** and, for production, configure custom SMTP. Supabase's
   built-in email sender is intended for development and has strict limits.
5. Optional hardening: enable leaked-password protection and keep the minimum password length at 8.
   The app requires at least 8 characters and caps new passwords at 72 characters / 72 UTF-8 bytes
   (bcrypt's limit).

Confirmation and recovery links use the PKCE flow. They must be opened in the same browser that
started the flow, because the code verifier lives in that browser's cookies.

## Commands

| Command                 | Purpose                                                      |
| ----------------------- | ------------------------------------------------------------ |
| `npm run dev`           | Start the development server (Turbopack).                    |
| `npm run build`         | Create a production build.                                   |
| `npm run start`         | Serve the production build.                                  |
| `npm run lint`          | Run ESLint across the repository.                            |
| `npm run lint:fix`      | Apply ESLint fixes.                                          |
| `npm run format`        | Format with Prettier, including Tailwind class sorting.      |
| `npm run format:check`  | Verify formatting without writing.                           |
| `npm run typecheck`     | Run `tsc --noEmit`.                                          |
| `npm run test`          | Run Vitest once.                                             |
| `npm run test:watch`    | Run Vitest in watch mode.                                    |
| `npm run test:coverage` | Run Vitest with V8 coverage.                                 |
| `npm run test:e2e`      | Run Playwright; starts the dev server automatically.         |
| `npm run test:e2e:ui`   | Open Playwright's UI mode.                                   |
| `npm run check`         | Format check + lint + typecheck + unit tests (no build/e2e). |

Before opening a pull request, run `npm run check` and `npm run build`. Run `npm run test:e2e` for
changes that affect routes, layout, auth, or interactive UI.

## Verified stack

Versions were checked against the npm registry and installed on **31 October 2026**. The important
pins are intentional:

| Area       | Package                       | Version       | Notes                                                                      |
| ---------- | ----------------------------- | ------------- | -------------------------------------------------------------------------- |
| Framework  | `next`                        | 16.4.3        | App Router, Turbopack, `src/proxy.ts`.                                     |
| UI runtime | `react`, `react-dom`          | 19.3.1        | Satisfies Next 16 peer range.                                              |
| Language   | `typescript`                  | 5.9.3         | Official create-next-app 16 uses `^5`; ESLint tooling supports `<6.1`.     |
| Styling    | `tailwindcss`                 | 4.3.3         | CSS-first config via `@theme inline`.                                      |
| Styling    | `@tailwindcss/postcss`        | 4.3.3         | Tailwind 4 PostCSS plugin.                                                 |
| Components | shadcn/ui conventions         | —             | `components.json` present; primitives hand-authored, no CLI run.           |
| Components | `@radix-ui/react-slot`        | 1.5.0         | `asChild` composition for Button.                                          |
| Components | `class-variance-authority`    | 0.7.1         | Variant API.                                                               |
| Components | `clsx`, `tailwind-merge`      | 2.1.1 / 3.7.0 | `cn()` class merging.                                                      |
| Icons      | `lucide-react`                | 1.66.0        | Icon set used by the design system.                                        |
| Auth       | `@supabase/supabase-js`       | 2.118.0       | Auth client.                                                               |
| Auth       | `@supabase/ssr`               | 0.12.7        | Cookie-based server/browser clients.                                       |
| Validation | `zod`                         | 4.6.7         | Auth input and field-level errors.                                         |
| Server     | `server-only`                 | 0.0.1         | Build-time guard for server modules.                                       |
| Linting    | `eslint`                      | 9.39.5        | Official create-next-app 16 uses `^9`; plugin peers do not all declare 10. |
| Linting    | `eslint-config-next`          | 16.4.3        | `core-web-vitals` + TypeScript flat configs.                               |
| Formatting | `prettier`                    | 3.9.10        | With `prettier-plugin-tailwindcss` 0.8.1.                                  |
| Unit tests | `vitest`                      | 5.0.5         | Vite 8.3.5, jsdom 30.1.3, Testing Library.                                 |
| Unit tests | `@testing-library/user-event` | 14.6.8        | Keyboard and form interaction tests.                                       |
| E2E tests  | `@playwright/test`            | 1.64.1        | Chromium project.                                                          |
| Runtime    | Node.js                       | 24.21.0       | Verified locally; `engines` requires `>=24.15.0`.                          |

### Deliberately deferred dependencies

These versions were verified but **not installed**, because the current task has no live
integration for them and unused runtime dependencies would be dead weight:

| Area           | Package(s)      | Verified version                       |
| -------------- | --------------- | -------------------------------------- |
| AI SDK         | `ai`            | 7.0.159                                |
| AI React hooks | `@ai-sdk/react` | 4.0.163                                |
| Retrieval      | `pgvector`      | Postgres extension, not an npm package |

The AI boundary currently uses framework-neutral contracts in `src/server/ai/provider.ts`. A future
adapter can wrap the Vercel AI SDK without changing feature code. Database tables, migrations, and
`pgvector` remain deferred until the next approved task.

### Why not TypeScript 7 or ESLint 10?

They are the current `latest` releases, but the Next 16 / ESLint plugin ecosystem has not all
declared support yet. TypeScript 7 falls outside `typescript-eslint`'s peer range, and
`eslint-plugin-jsx-a11y` (shipped by `eslint-config-next`) does not declare ESLint 10. The official
create-next-app 16.4.3 source installs TypeScript `^5` and ESLint `^9`. Matching the supported line
keeps linting and type-aware tooling reliable.

## Project structure

```text
.
├── e2e/                          # Playwright end-to-end tests
├── src/
│   ├── app/                      # Routing only: layouts, pages, route handlers
│   │   ├── (site)/               # Public site shell (header + footer)
│   │   │   ├── _components/      # Route-local, non-routed components
│   │   │   ├── design-system/    # Design reference page
│   │   │   └── page.tsx          # Landing page
│   │   ├── (auth)/               # Guest-only auth screens
│   │   ├── (app)/                # Server-protected app shell + dashboard
│   │   ├── auth/callback/        # PKCE confirmation/recovery callback
│   │   ├── globals.css           # Design tokens + base/component styles
│   │   ├── icon.svg              # App icon
│   │   └── layout.tsx            # Root HTML, fonts, metadata
│   ├── components/
│   │   ├── brand/                # Brand mark and logo
│   │   ├── layout/               # Site header and footer
│   │   └── ui/                   # Shared, feature-agnostic primitives
│   ├── features/
│   │   └── auth/                 # Auth UI, schemas, actions, session helpers
│   ├── lib/                      # Pure shared utilities, env, route/redirect rules
│   │   ├── auth/                 # Auth route constants + redirect sanitization
│   │   └── supabase/             # Public config validation
│   ├── server/                   # Server-only capabilities and contracts
│   │   ├── ai/                   # Provider interface (no implementation yet)
│   │   ├── db/                   # Database rules (no client/schema yet)
│   │   ├── documents/            # Source/citation contracts (no pipeline yet)
│   │   └── supabase/             # Request-scoped server + proxy clients
│   ├── proxy.ts                  # Session refresh + coarse route protection
│   └── test/                     # Vitest setup
├── AGENTS.md                     # Architecture rules and implementation conventions
├── components.json               # shadcn/ui CLI-compatible configuration
├── playwright.config.ts
└── vitest.config.ts
```

### Feature shape

Each feature is one vertical slice rather than a UI-only folder:

```text
src/features/<feature>/
├── components/   # UI scoped to the feature
├── server/       # Server actions, use cases, orchestration
├── schemas/      # Validation schemas
├── types.ts      # Domain types owned by the feature
└── index.ts      # Small public API; other features import only this
```

`src/features/auth` is the first concrete example. Routes compose features; features do not import
routes. Cross-feature imports go through the public `index.ts`. Shared primitives are promoted to
`src/components/ui` only when at least two features need the same semantics. See
`src/features/README.md` for details.

## Authentication architecture

| Route group      | Access                       | Responsibility                                              |
| ---------------- | ---------------------------- | ----------------------------------------------------------- |
| `(site)`         | Public                       | Landing page and design reference.                          |
| `(auth)`         | Guests; reset needs recovery | Sign-in, sign-up, forgot password, reset, confirm email.    |
| `(app)`          | Authenticated only           | Protected shell, dashboard, and account password change.    |
| `/auth/callback` | Public link endpoint         | Exchanges a PKCE code for a session, then redirects safely. |

Request flow:

1. `src/proxy.ts` matches navigations, refreshes the Supabase session with `auth.getUser()`, writes
   refreshed cookies to the request and response, and performs coarse redirects. It is an optimistic
   gate, not the authorization boundary.
2. `src/app/(app)/layout.tsx` calls `requireUser()` on every protected render. The check uses
   Supabase Auth, never a client-supplied user ID.
3. Auth mutations are Server Actions in `src/features/auth/server/actions.ts`. They validate input
   with zod, call Supabase, map provider error codes to safe messages, and redirect only to sanitized
   paths.
4. Email links land on `/auth/callback`, which exchanges the PKCE code and redirects to a sanitized
   `next` path. Invalid or expired links return to `/sign-in` with a recoverable message.
5. Password reset requires a recent, server-verified recovery session. The action reads Supabase's
   signed JWT `amr` claim and requires a `recovery` entry with a timestamp no older than 60 minutes;
   a normal authenticated session cannot use `/reset-password`. A completed reset revokes every
   session, including the recovery session, and returns the user to sign-in.
6. Authenticated password change lives at `/account/password`. It re-authenticates with the current
   password before setting a new one, then revokes other sessions and keeps the current session.

Security properties:

- `getCurrentUser()` validates the access token with Supabase and treats outages as unauthenticated.
  It is wrapped in React `cache()` to deduplicate calls within one render.
- Recovery authorization is derived from Supabase's signed JWT `amr` claim, never from a client
  flag or a user ID. `getRecoveryAuthorization()` also calls `getUser()` first, so a revoked session
  cannot authorize a reset. String-only `amr` claims and stale recovery timestamps fail closed.
- Authenticated password change requires the current password. A normal signed-in session is not
  sufficient to set a new password without that re-authentication.
- Post-login destinations are same-origin paths only. Absolute URLs, protocol-relative URLs,
  backslashes, dot-segment normalization, encoded path separators, control characters, and auth
  screens are rejected.
- Recovery and resend responses stay generic so the UI does not disclose whether an account exists.
- No service-role key is used. The browser receives only the publishable/anon key, which is designed
  to be public.
- Server-side Supabase Auth requests are bounded by a 10-second abort timeout. A stalled provider is
  treated as unauthenticated rather than hanging the render or proxy.
- Sign-out clears local Supabase auth cookies even when global revocation cannot be confirmed. The
  sign-in screen shows a partial-result notice instead of claiming every session was revoked.
- The browser Supabase client factory exists for future client-side reads/realtime. Auth writes go
  through Server Actions.

### Data and migrations

Task 002 adds **no application tables, migrations, or RLS policies**. Supabase Auth owns the user
record; the dashboard reads `user.email`, `user.created_at`, and the optional `full_name` stored in
`user.user_metadata`.

When application data is approved:

- Put SQL migrations in `supabase/migrations/` and review them like code.
- Enable RLS on every user-owned table before exposing it.
- Prefer the publishable/anon key plus RLS for user-scoped queries.
- Keep any service-role use server-only and restricted to narrow trusted operations.
- Add integration tests against a disposable Supabase instance before claiming queries work.

## Architecture boundaries

```text
src/app (routes) ──► src/features (use cases) ──► src/server (ai · documents · db · supabase)
        │                    │
        └──────────► src/components/ui + src/lib ◄──┘
```

- **UI** renders props and calls Server Actions. It never imports database clients, provider SDKs,
  or secrets.
- **Features** own one capability end to end. They may compose shared UI, pure utilities, and server
  contracts; they may not import routes.
- **Server** contains cross-feature capabilities: Supabase clients, AI provider contracts/adapters,
  document extraction and citation logic, and repositories. It must not import React, routes,
  components, or features.
- **Shared UI and `src/lib`** stay pure and feature-agnostic. They must not import `src/server` or
  `src/features`.
- ESLint enforces the import directions that are enforceable today. See `AGENTS.md` for the full
  rules and the definition of done.

The AI and document modules contain **contracts only**. No provider is called, no file is parsed,
and no application table exists.

## Design system

Tokens live in [`src/app/globals.css`](src/app/globals.css) and are exposed as Tailwind utilities.
Raw hex values stay in that file; application code uses semantic class names.

| Token                | Value     | Utility               | Role                                |
| -------------------- | --------- | --------------------- | ----------------------------------- |
| `--background`       | `#060D20` | `bg-background`       | Application canvas                  |
| `--surface`          | `#1B1B1B` | `bg-surface`          | Cards and panels                    |
| `--surface-elevated` | `#2C394B` | `bg-surface-elevated` | Nested layers, hover states         |
| `--ai`               | `#8E05C2` | `bg-ai` / `text-ai`   | Dawai AI accent; primary actions    |
| `--progress`         | `#6A68F6` | `bg-progress`         | Learning/progress and focus signals |
| `--danger`           | `#FFB4B4` | `text-danger`         | Error text and destructive notices  |
| `--ink-muted`        | `#CCDEF6` | `text-ink-muted`      | Secondary and long-form text        |
| `--foreground`       | `#FFFFFF` | `text-foreground`     | Primary text                        |

Typography: **Montserrat** for UI/navigation and **Source Serif 4** for learning content
(`.learning-content`). Both are loaded with `next/font` and self-hosted at build time.

Accessibility rules that matter for this palette:

- White on `#8E05C2` is 7.12:1 — safe for primary buttons.
- `#8E05C2` on the navy canvas is 2.72:1 — use purple for surfaces/graphics, **never small text**.
- `#CCDEF6` on the canvas is 14.13:1 — the default body color.
- `#6A68F6` on the canvas is 4.53:1 — acceptable for normal text on the canvas, not on elevated
  surfaces.
- `#FFB4B4` on `#1B1B1B` is 10.20:1 — used for error text on cards and elevated surfaces.

The reference page documents color, type, components, learning-content styles, radii, elevation,
and current accessibility gaps: `/design-system`.

## Environment variables

| Variable                               | Scope       | Status in Task 002                                                   |
| -------------------------------------- | ----------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                  | Public      | Read; defaults to `http://localhost:3000`. Set in production.        |
| `NEXT_PUBLIC_SUPABASE_URL`             | Public      | Required for auth. Validated as an absolute http(s) URL.             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public      | Required for auth. Publishable or legacy anon key; secrets rejected. |
| `AI_GATEWAY_API_KEY`                   | Server only | Reserved for a future AI task. Not read in Task 002. Never expose.   |

Copy `.env.example` to `.env.local` and keep real credentials out of git. Do not add a secret to a
`NEXT_PUBLIC_*` variable. A malformed or missing Supabase configuration produces an actionable
setup notice; values are never logged. `NEXT_PUBLIC_*` values are inlined at build time, so rebuild
after changing them.

## Testing

```bash
npm run test          # Vitest + Testing Library (jsdom)
npm run test:coverage # V8 coverage; report in ./coverage
npm run test:e2e      # Playwright; starts the dev server
```

Auth E2E tests call the configured Supabase project for invalid-credential and invalid-link paths. Run
them with `.env.local` populated; they do not create users or send email.

Coverage is collected but **no thresholds are enforced yet**. On 2 November 2026, `npm run test`
passed **133 tests across 18 files** and coverage reported **83.5% statements / 81.48% branches /
69.89% functions / 83.79% lines**. Playwright passed **16 tests** in one Chromium project against
`http://localhost:3000`.

The E2E suite covers:

- Guest redirects from `/dashboard` and `/account/password`, including preservation of a safe `next`
  path.
- Rejection of an unsafe `next` parameter.
- Labelled fields, keyboard-operable password visibility, and focus behavior.
- Live Supabase failure paths: invalid credentials and an invalid callback code.
- The reset form being unavailable without a recovery session.
- Client-side sign-up password mismatch (no account is created).
- Generic password-recovery response for a missing account.
- No horizontal overflow on `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, and
  `/confirm-email` at 320, 390, 768, and 1440 px.

**Live vs mocked:** On 2 November 2026, a manual live pass with one dedicated test account in the
Dawai development project verified registration and confirmation email delivery, the confirmation
callback, sign-in, dashboard persistence across refresh and a new tab, sign-out and protected-route
rejection, recovery email delivery, the recovery callback, the live recovery `amr` claim, password
reset, old-password rejection, login with the new password, authenticated password change with
current-password verification, and revocation of a second browser session. No credentials, tokens,
or private links are recorded here. The live `amr` claim contained a detailed object with
`method: "recovery"` and a numeric Unix-seconds timestamp.

The live pass found and fixed a callback bug: `/reset-password` was rejected by the post-auth
redirect sanitizer, so recovery links landed on `/dashboard`. The callback now permits only that one
recovery destination; ordinary post-login redirects still reject auth screens. Regression tests
cover the callback destination and the forgot-password link target.

Remaining unverified live paths: access-token refresh after JWT expiry (session persistence is
verified and the refresh path is unit-tested), sign-out during a Supabase outage, PKCE links opened
in a different browser, and global reset revocation across a second pre-existing session. The E2E
suite's failure paths reach the configured Supabase project; its success paths use mocks.

### Manual live verification (requires approval)

Do not create accounts or send email in an automated test. Use a dedicated test account and a
controlled inbox, and record the date and Supabase project. Do not paste credentials or private
links into issues, logs, or screenshots.

1. **Register:** open `/sign-up`, use a unique test email and a strong password. Expect the
   confirmation screen, no authenticated dashboard, and `/dashboard` redirecting to sign-in.
2. **Confirm:** open the confirmation link in the same browser. Expect `/dashboard`; the dashboard
   is the success state. `?notice=welcome` is used when confirmation is disabled or the
   `/confirm-email` page is visited with a session. Refresh and open a new tab and confirm the
   session persists.
3. **Sign out:** use the header button. Expect `/sign-in?notice=signed-out`; `/dashboard` must
   redirect back with `next=%2Fdashboard`.
4. **Sign in:** use the confirmed account. Expect the dashboard; refresh and confirm the session is
   still valid.
5. **Request recovery:** sign out, open `/forgot-password`, and submit the test email. Expect the
   generic "if an account exists" message and one recovery email. Open the link in the same browser.
6. **Reset:** expect the reset form, set a new password, and submit. Expect
   `/sign-in?notice=password-updated`. The old password must fail and the new password must work.
   Reopening the same recovery link must show invalid/expired.
7. **Recovery isolation:** while signed in normally, open `/reset-password`. Expect the
   "Open the reset link from your email" notice, no reset form, and a link to account settings.
8. **Authenticated change:** open `/account/password`. A wrong current password must show a field
   error. A correct current password plus a new password must succeed, keep this session signed in,
   and sign out another browser session.
9. **Failure paths:** open `/auth/callback?code=not-a-real-code`; expect `/sign-in?error=invalid-link`.
   With DevTools offline or the Supabase host blocked, sign out. Expect
   `/sign-in?notice=signed-out-partial`; protected pages must not render from stale cookies. If the
   session still works, record the failure and the browser/network conditions.
10. **Session refresh:** with a short JWT expiry configured in Supabase, wait for expiry and refresh
    `/dashboard`. Expect the session to refresh without a visible sign-out. Restore the normal expiry
    afterward.

**Local browser caveat (macOS 13 + Playwright 1.64):** Playwright 1.64 cannot download its current
bundled Chromium on macOS 13, and Google Chrome 156 aborted headless launches on the verification
host. Turbopack's dev server also failed to start its FSEvent stream, so the suite ran against a
production build with a previously cached Playwright Chromium build. On a supported host, run
`npx playwright install chromium` and `npm run test:e2e`. The documented fallback for hosts with a
working Chrome installation remains:

```bash
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

CI should use the bundled browser after `npx playwright install chromium`. The Playwright config
builds and starts the production server when `CI` is set.

## Security and production notes

- Security headers (`nosniff`, `DENY` framing, strict-origin referrer policy) are set in
  `next.config.ts`. A content security policy is deferred until asset and provider requirements are
  known; auth tokens live in cookies readable by the Supabase browser client, so XSS protection is
  important.
- `poweredByHeader` is disabled.
- Authentication is implemented, but authorization beyond “is this user signed in?” is not. There
  are no application tables, roles, or per-resource permissions yet.
- Rate limiting is currently delegated to Supabase Auth. There is no application-level rate limiter
  or bot protection in front of the auth forms.
- PKCE email links are browser-bound. Opening a confirmation or recovery link in a different browser
  fails safely and asks for a new link.
- Password policy is length-only (at least 8 characters, at most 72 characters / 72 UTF-8 bytes)
  plus whatever Supabase enforces. There is no MFA, email-change flow, account deletion, or admin
  tooling.
- The publishable key is safe to ship; the service-role key must never reach the client or a
  `NEXT_PUBLIC_*` variable.

## Scope and next steps

Intentionally **not** implemented in Task 002: application tables/migrations, profiles, study packs,
document ingestion, RAG/pgvector, live AI providers, quizzes, TTS, analytics, billing, and CI
workflows.

Task 003 should start only after approval. Recommended order:

1. **Task 003:** Profiles and the initial learning schema with RLS, repository contracts, and
   integration tests against a disposable Supabase instance.
2. **Task 004:** AI provider adapter behind `AiProvider` with a deterministic test double and
   usage/cost boundaries.
3. **Task 005:** Document ingestion with citation locators, then retrieval, grounded tutoring, and
   quizzes.
4. **Later:** Audio lessons/TTS, progress model, CI, automated accessibility checks, deployment.

## License

Private portfolio project. No license has been granted.
