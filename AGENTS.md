# AGENTS.md — Dawai

This file is the operating manual for anyone (human or agent) changing this repository. Read it
before writing code. If a change requires breaking a rule here, update this file in the same change
and explain why.

## Project and current scope

Dawai is an AI-powered learning companion for documents, webpages, and educational video. The
target experience is source-grounded explanation, audio lessons, interactive tutoring, quizzes, and
personalized feedback.

**Current state: Task 002 — Authentication foundation.** Email/password accounts, server-validated
sessions, a protected dashboard, email confirmation, password recovery/reset, and authenticated
password change are implemented with Supabase Auth. The repository also contains the Task 001 shell,
design tokens, shared primitives, contracts, tests, and documentation.

Not implemented, and **not to be added without explicit approval**:

- Application database tables, migrations, profiles, or RLS policies
- Live AI provider calls or prompt/agent pipelines
- Document upload, parsing, embeddings, retrieval, or `pgvector`
- Quizzes, TTS/audio generation, tutoring, or analytics
- CI workflows or deployment configuration

Task 003 starts only after Task 002 is reviewed and approved. Do not “helpfully” implement the next
task in advance.

## Commands

| Command                 | Purpose                                          |
| ----------------------- | ------------------------------------------------ |
| `npm run dev`           | Development server on `http://localhost:3000`.   |
| `npm run build`         | Production build.                                |
| `npm run start`         | Serve the production build.                      |
| `npm run lint`          | ESLint, including import-boundary rules.         |
| `npm run format`        | Prettier with Tailwind class sorting.            |
| `npm run format:check`  | Formatting verification.                         |
| `npm run typecheck`     | `tsc --noEmit`.                                  |
| `npm run test`          | Vitest once.                                     |
| `npm run test:watch`    | Vitest watch mode.                               |
| `npm run test:coverage` | Vitest with V8 coverage.                         |
| `npm run test:e2e`      | Playwright; starts the dev server automatically. |
| `npm run check`         | Format check, lint, typecheck, unit tests.       |

On macOS 13, Playwright 1.64 cannot download its current bundled Chromium. Use a previously cached
Playwright Chromium or a working Chrome installation via `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`.
Chrome 156 aborted headless launches on the verification host, so record which browser actually ran.
Do not commit a machine-specific browser path.

## Architecture map

```text
src/app (routes, layouts, route handlers)
   │
   ├──► src/features/<feature> (vertical slice: UI + use cases + schemas)
   │          │
   │          └──► src/server (cross-feature server capabilities)
   │                   ├── ai/
   │                   ├── documents/
   │                   ├── db/
   │                   └── supabase/
   │
   └──► src/components/{ui,layout,brand} + src/lib (pure shared code)

src/proxy.ts (session refresh + coarse route protection) ──► src/lib + src/server/supabase
```

### Allowed dependency directions

| From               | May import                         | Must not import                              |
| ------------------ | ---------------------------------- | -------------------------------------------- |
| `src/app`          | features, components, lib, server  | —                                            |
| `src/features/*`   | components/ui, lib, server, itself | `src/app`; another feature's internals       |
| `src/components/*` | lib, other shared components       | `src/server`, `src/features`, `src/app`      |
| `src/lib`          | other pure lib modules             | React UI with side effects, server, features |
| `src/server/*`     | lib, other server modules          | React, `src/app`, components, features       |
| `src/proxy.ts`     | lib, server                        | React, `src/app`, components, features       |

ESLint enforces these directions where practical. If you find a boundary that ESLint cannot express,
document it and enforce it in review. Do not weaken a rule to make an import compile.

### Layer responsibilities

- **`src/app`** — routing and composition. Page files should stay thin: fetch/validate at the edge,
  then render a feature or shared component. Route handlers belong here and delegate to server
  modules.
- **`src/features`** — one user capability end to end. It owns its UI, schemas, server actions, and
  domain types. Expose a small `index.ts`; no deep imports across features. `src/features/auth` is
  the reference implementation.
- **`src/server/supabase`** — cookie-bound Supabase clients and proxy session refresh. Never import
  React or expose the service-role key. Create a client per request; never cache one in module scope.
- **`src/server/ai`** — provider contracts and (later) vendor adapters. Features depend on
  `AiProvider`, never directly on a model SDK.
- **`src/server/documents`** — extraction, chunking, citation locators, and future ingestion
  orchestration. Keep page/timestamp provenance with every segment.
- **`src/server/db`** — repositories and schema-derived types. No UI imports, no service-role use
  outside trusted server paths.
- **`src/components/ui`** — feature-agnostic primitives. Promote a component here only when more
  than one feature shares the same semantics.
- **`src/lib`** — pure utilities, environment access, and static config. No React, no network, no
  database.
- **`src/proxy.ts`** — refreshes sessions and performs coarse redirects. It is an optimistic gate;
  layouts and pages must re-check identity on the server.

## Non-negotiable rules

1. **Do not fabricate functionality.** Never claim auth, persistence, AI, uploads, or retrieval
   work unless it is implemented and tested. Label concepts, mocks, and unverified live paths
   clearly.
2. **Do not hardcode secrets.** No API keys, tokens, service-role keys, or credentials in source,
   tests, fixtures, screenshots, or docs. Use `.env.local` and `.env.example` placeholders.
3. **Do not use `NEXT_PUBLIC_*` for secrets.** Anything public is shipped to the browser.
4. **Do not add dependencies casually.** Justify each addition against the platform, an existing
   dependency, or a small amount of local code. Remove unused packages in the same change.
5. **Do not use raw colors or one-off typography.** Use semantic tokens from `globals.css`. New
   palette values require design approval and contrast checks.
6. **Do not bypass the layer boundaries.** No Supabase/AI SDK calls in components. No data fetching
   in UI primitives. No route imports from features.
7. **Keep the scope of the current task.** No opportunistic schema, RAG, provider, or additional
   auth-provider work.
8. **TypeScript is strict.** Avoid `any`; use `unknown` plus validation or a narrow type. Prefer
   `satisfies` for object literals whose shape should be checked without widening.
9. **Server by default.** Add `"use client"` only to the leaf component that needs state, effects,
   or browser APIs. Keep client bundles small.
10. **Accessibility is part of done.** Labels, keyboard access, focus visibility, reduced motion,
    and contrast are not follow-up work.

## Implementation conventions

### TypeScript and React

- Use the App Router. Server Components are the default; client components are leaves.
- Use named exports for components and utilities. Next.js route files keep their reserved default
  exports.
- Use `import type` for type-only imports (enforced by ESLint).
- Prefer `type` aliases for props; use interfaces for extendable contracts.
- Use Server Actions for mutations. Do not create REST endpoints just to call them from the same
  app. Use route handlers for webhooks, uploads, streaming, third-party callbacks, and auth
  callbacks.
- Validate all external input at the boundary (request body, search params, form data, env). Add
  `zod` with the first real validation need; do not hand-roll complex validators.
- Return serializable data from server components/actions. Never pass class instances or clients to
  the browser.
- Handle loading, empty, error, and unauthorized states explicitly when a real flow is built.

### File and naming conventions

- Directories and component files: `kebab-case.tsx` (for example `hero-study-panel.tsx`).
- Components/types: `PascalCase`; functions/variables: `camelCase`; constants: `SCREAMING_SNAKE_CASE`
  only for true constants.
- Route-local components live in a private `_components/` folder inside the route segment.
- Colocate tests next to source: `button.test.tsx` beside `button.tsx`.
- Prefer one responsibility per file. Split a component when it owns unrelated state or markup.

### Styling

- Use Tailwind utilities and the semantic tokens generated from `src/app/globals.css`.
- Use `cn()` from `src/lib/utils.ts` for conditional/conflicting classes.
- Use `cva` for variant-rich primitives; keep variant names semantic, not visual.
- Do not add a `tailwind.config.ts`; Tailwind 4 is configured in CSS with `@theme inline`.
- Dark is the only theme in Task 002. Do not add a theme toggle or a light palette without design
  approval.
- Use `font-sans` for product chrome and `.learning-content` / `font-serif` for long-form learning
  material.
- Avoid arbitrary values when a token exists. If a one-off is necessary, keep it local and explain
  it.
- Motion must be subtle and respect `prefers-reduced-motion`. Do not animate content that users
  need to read.

### Accessibility and contrast

- Use semantic landmarks (`header`, `nav`, `main`, `footer`) and exactly one `h1` per page.
- Every form control needs a visible label. Placeholders are hints, not labels.
- Do not use purple `#8E05C2` for small text on navy (2.72:1). It is a surface/graphic color.
- Use `#CCDEF6` or white for body text on navy. Check contrast on elevated surfaces, not just the
  canvas.
- Status must include text or an icon plus text; color alone is not sufficient.
- Keep the skip link, focus outline, and reduced-motion behavior intact.
- New interactive components require keyboard testing and an accessible name.

### Auth and sessions

- Authentication is server-authoritative. Resolve identity with `getCurrentUser()` or
  `requireUser()`; never accept a user ID, email, or role from a form or client component.
- Use `createSupabaseServerClient()` per request. Never cache a client in module scope or pass one to
  the browser. Session refresh belongs in `src/proxy.ts`; protected layouts must still re-check.
- Only publishable/legacy anon keys may be public. Reject `sb_secret_*` and `service_role` values in
  `NEXT_PUBLIC_*`. Do not add a service-role client without an approved, narrowly scoped need.
- Auth mutations go through Server Actions in `src/features/auth/server`. Validate input with zod
  and map provider error codes; never forward raw Supabase error messages or log credentials.
- Sanitize every post-auth destination with `sanitizeRedirectPath()`. Reject absolute URLs,
  protocol-relative URLs, backslashes, dot-segment normalization, encoded path separators, control
  characters, and auth screens.
- Keep Supabase imports out of presentation components. UI may import auth actions and client-safe
  components only.
- Recovery and resend responses must stay generic so they do not reveal whether an account exists.
- Password reset is recovery-only. Authorize it with `getRecoveryAuthorization()`: Supabase's signed
  JWT `amr` claim must contain a `recovery` entry with a timestamp no older than 60 minutes. Never
  trust a client flag, hidden field, or ordinary authenticated session for reset authorization.
- Authenticated password change is a separate flow. Require the current password before setting a
  new one; do not reuse the recovery reset action for signed-in users.
- A completed reset revokes every session, including the recovery session, and returns to sign-in.
  An authenticated password change revokes other sessions. Report partial revocation honestly.
- If a sign-out revocation call fails, clear local auth cookies with `clearSupabaseAuthCookies()` so
  stale cookies cannot keep rendering protected pages. Show a partial-result notice; do not claim
  every session was revoked.
- PKCE email links are browser-bound. Copy must tell users to open the link in the same browser.

### Server, AI, and data

- AI access goes through `AiProvider` (`src/server/ai/provider.ts`). Adapters may import vendor SDKs;
  features must not.
- Persist source provenance (page, timestamp, URL) with extracted segments so citations survive
  retrieval.
- Keep the service-role Supabase key server-only. Prefer the publishable/anon key plus RLS for
  user-scoped queries.
- Enable RLS on every user-owned table before exposing it. Migrations live in `supabase/migrations/`
  when approved.
- Do not log prompts, source text, auth tokens, or user content by default. Redact secrets and
  personal data.
- Add timeouts/cancellation and bounded retries to external calls. Fail visibly rather than silently
  returning fabricated content.

### Testing

- Test behavior, not implementation details. Avoid snapshot tests for UI.
- Unit-test pure logic and component contracts (variants, accessible names, state).
- Add Playwright coverage for each primary user flow and for regressions that unit tests cannot catch.
  Auth E2E must cover protected-route redirects, unsafe `next` values, live failure paths, and small
  viewports (320 px and up).
- Test failure paths where the product can fail: empty sources, invalid input, provider errors,
  insufficient permissions.
- Do not mock the thing under test. Mock network boundaries with realistic fixtures. Automated tests
  must not create real users or send real confirmation/recovery email; verify those paths manually
  with a designated test account and record what remains unverified.
- No coverage threshold exists yet. When domain logic lands, add thresholds and enforce them in CI.
- A test that only renders a component without asserting meaningful behavior is not sufficient
  coverage for a new feature.

### Documentation and git

- Update `README.md` when setup, commands, stack, or architecture changes.
- Update this file when a boundary or convention changes.
- Keep `.env.example` in sync with every new variable; never add real values.
- Use focused commits with conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `test:`,
  `refactor:`). Do not commit generated output (`.next`, coverage, Playwright artifacts).
- Do not rewrite or discard unrelated user changes.

## Definition of done

A change is complete only when:

- [ ] The implementation matches the approved task scope and this document.
- [ ] No secrets, fake integrations, or placeholder claims of functionality were introduced.
- [ ] `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run test` pass.
- [ ] `npm run build` passes for route, layout, or server changes.
- [ ] `npm run test:e2e` passes for user-facing flows (or the reason it cannot run is recorded).
- [ ] New behavior has tests, including at least one failure/edge case.
- [ ] Accessibility basics are verified: keyboard path, labels, focus, contrast, reduced motion.
- [ ] README/AGENTS/.env.example are updated if the change affects them.
- [ ] The completion report states what was verified and what remains unverified.

## Roadmap (requires approval)

1. **Task 003:** Profiles and the initial learning schema with RLS, repository contracts, and
   integration tests against a disposable Supabase instance.
2. **Task 004:** AI provider adapter behind `AiProvider`, deterministic test double, usage/cost
   boundaries.
3. **Task 005:** Document ingestion with source locators, chunking, and embeddings.
4. **Task 006:** Retrieval, grounded tutoring, quizzes, and feedback.
5. **Later:** Audio lessons/TTS, progress model, CI, automated accessibility checks, deployment.

Stop after the approved task and report for review. Do not proceed to the next task automatically.
