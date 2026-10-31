# AGENTS.md — Dawai

This file is the operating manual for anyone (human or agent) changing this repository. Read it
before writing code. If a change requires breaking a rule here, update this file in the same change
and explain why.

## Project and current scope

Dawai is an AI-powered learning companion for documents, webpages, and educational video. The
target experience is source-grounded explanation, audio lessons, interactive tutoring, quizzes, and
personalized feedback.

**Current state: Task 001 — Project Foundation only.** The repository contains a working Next.js
shell, design tokens, shared primitives, contracts, tests, and documentation.

Not implemented, and **not to be added without explicit approval**:

- Authentication or session flows
- Database tables, migrations, or Supabase clients
- Live AI provider calls or prompt/agent pipelines
- Document upload, parsing, embeddings, retrieval, or `pgvector`
- Quizzes, TTS/audio generation, tutoring, or analytics
- CI workflows or deployment configuration

Task 002+ starts only after the foundation is reviewed and approved. Do not “helpfully” implement
the next task in advance.

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

On macOS 13, Playwright 1.64 cannot download bundled Chromium. Use
`PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` with Google Chrome installed. Do not commit a
machine-specific browser path.

## Architecture map

```text
src/app (routes, layouts, route handlers)
   │
   ├──► src/features/<feature> (vertical slice: UI + use cases + schemas)
   │          │
   │          └──► src/server (cross-feature server capabilities)
   │                   ├── ai/
   │                   ├── documents/
   │                   └── db/
   │
   └──► src/components/{ui,layout,brand} + src/lib (pure shared code)
```

### Allowed dependency directions

| From               | May import                         | Must not import                              |
| ------------------ | ---------------------------------- | -------------------------------------------- |
| `src/app`          | features, components, lib, server  | —                                            |
| `src/features/*`   | components/ui, lib, server, itself | `src/app`; another feature's internals       |
| `src/components/*` | lib, other shared components       | `src/server`, `src/features`, `src/app`      |
| `src/lib`          | other pure lib modules             | React UI with side effects, server, features |
| `src/server/*`     | lib, other server modules          | React, `src/app`, components, features       |

ESLint enforces these directions where practical. If you find a boundary that ESLint cannot express,
document it and enforce it in review. Do not weaken a rule to make an import compile.

### Layer responsibilities

- **`src/app`** — routing and composition. Page files should stay thin: fetch/validate at the edge,
  then render a feature or shared component. Route handlers belong here and delegate to server
  modules.
- **`src/features`** — one user capability end to end. It owns its UI, schemas, server actions, and
  domain types. Expose a small `index.ts`; no deep imports across features.
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

## Non-negotiable rules

1. **Do not fabricate functionality.** Never claim auth, persistence, AI, uploads, or retrieval
   work unless it is implemented and tested. Label concepts and specimens clearly.
2. **Do not hardcode secrets.** No API keys, tokens, service-role keys, or credentials in source,
   tests, fixtures, screenshots, or docs. Use `.env.local` and `.env.example` placeholders.
3. **Do not use `NEXT_PUBLIC_*` for secrets.** Anything public is shipped to the browser.
4. **Do not add dependencies casually.** Justify each addition against the platform, an existing
   dependency, or a small amount of local code. Remove unused packages in the same change.
5. **Do not use raw colors or one-off typography.** Use semantic tokens from `globals.css`. New
   palette values require design approval and contrast checks.
6. **Do not bypass the layer boundaries.** No Supabase/AI SDK calls in components. No data fetching
   in UI primitives. No route imports from features.
7. **Keep the scope of the current task.** No opportunistic auth, schema, RAG, or provider work.
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
- Use Server Actions for mutations once auth exists. Do not create REST endpoints just to call them
  from the same app. Use route handlers for webhooks, uploads, streaming, and third-party callbacks.
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
- Dark is the only theme in Task 001. Do not add a theme toggle or a light palette without design
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

### Server, AI, and data

- AI access goes through `AiProvider` (`src/server/ai/provider.ts`). Adapters may import vendor SDKs;
  features must not.
- Persist source provenance (page, timestamp, URL) with extracted segments so citations survive
  retrieval.
- Keep the service-role Supabase key server-only. Prefer the anon key plus RLS for user-scoped
  queries.
- Enable RLS on every user-owned table before exposing it. Migrations live in `supabase/migrations/`
  when approved.
- Do not log prompts, source text, or user content by default. Redact secrets and personal data.
- Add timeouts/cancellation and bounded retries to external calls. Fail visibly rather than silently
  returning fabricated content.

### Testing

- Test behavior, not implementation details. Avoid snapshot tests for UI.
- Unit-test pure logic and component contracts (variants, accessible names, state).
- Add Playwright coverage for each primary user flow and for regressions that unit tests cannot catch.
- Test failure paths where the product can fail: empty sources, invalid input, provider errors,
  insufficient permissions.
- Do not mock the thing under test. Mock network boundaries with realistic fixtures.
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

1. **Task 002:** Supabase auth and initial schema with RLS, repository contracts, integration tests.
2. **Task 003:** AI provider adapter behind `AiProvider`, deterministic test double, usage/cost
   boundaries.
3. **Task 004:** Document ingestion with source locators, chunking, and embeddings.
4. **Task 005:** Retrieval, grounded tutoring, quizzes, and feedback.
5. **Later:** Audio lessons/TTS, progress model, CI, automated accessibility checks, deployment.

Stop after the approved task and report for review. Do not proceed to the next task automatically.
