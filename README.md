# Dawai

Dawai is an AI-powered learning companion for documents, webpages, and educational video. The
product direction is source-grounded explanation, audio lessons, interactive tutoring, quizzes, and
personalized feedback.

> **Current state: Task 001 — Project Foundation.** This repository is a working development
> environment and design foundation, not a functioning product. Authentication, database tables,
> live AI calls, document uploads, retrieval, quizzes, and TTS are intentionally not implemented.

## What is in place

- Next.js 16 App Router with strict TypeScript and a route-group shell.
- A dark-first design system with semantic tokens, Montserrat UI type, and Source Serif 4 for
  learning content.
- Shared, accessible UI primitives in the shadcn/ui style: button, badge, card, input, progress.
- An honest product landing page and a `/design-system` reference page.
- Feature-oriented boundaries for UI, business logic, database access, AI services, and document
  processing.
- Vitest + Testing Library for unit/component tests and Playwright for end-to-end smoke tests.
- ESLint (including import-boundary rules), Prettier, EditorConfig, and security headers.
- Environment template, setup docs, and architecture rules in `AGENTS.md`.

## Requirements

- **Node.js 24.15 or newer** (`.nvmrc` pins 24). The test environment (`jsdom` 30) requires
  24.15+.
- **npm 11+** (the repository ships a `package-lock.json`; npm 12 was used for verification).
- Network access on the first build so `next/font` can fetch and self-host the font files.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The design reference lives at
[http://localhost:3000/design-system](http://localhost:3000/design-system).

`NEXT_PUBLIC_APP_URL` falls back to `http://localhost:3000`, so `.env.local` is not required for
local development. All other variables in `.env.example` are documented for future tasks and are
**not read by the application yet**.

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
changes that affect routes, layout, or interactive UI.

## Verified stack

Versions were checked against the npm registry and installed on **31 October 2026**. The important
pins are intentional:

| Area       | Package                    | Version       | Notes                                                                      |
| ---------- | -------------------------- | ------------- | -------------------------------------------------------------------------- |
| Framework  | `next`                     | 16.4.3        | App Router, Turbopack.                                                     |
| UI runtime | `react`, `react-dom`       | 19.3.1        | Satisfies Next 16 peer range.                                              |
| Language   | `typescript`               | 5.9.3         | Official create-next-app 16 uses `^5`; ESLint tooling supports `<6.1`.     |
| Styling    | `tailwindcss`              | 4.3.3         | CSS-first config via `@theme inline`.                                      |
| Styling    | `@tailwindcss/postcss`     | 4.3.3         | Tailwind 4 PostCSS plugin.                                                 |
| Components | shadcn/ui conventions      | —             | `components.json` present; primitives hand-authored, no CLI run.           |
| Components | `@radix-ui/react-slot`     | 1.5.0         | `asChild` composition for Button.                                          |
| Components | `class-variance-authority` | 0.7.1         | Variant API.                                                               |
| Components | `clsx`, `tailwind-merge`   | 2.1.1 / 3.7.0 | `cn()` class merging.                                                      |
| Icons      | `lucide-react`             | 1.66.0        | Icon set used by the design system.                                        |
| Linting    | `eslint`                   | 9.39.5        | Official create-next-app 16 uses `^9`; plugin peers do not all declare 10. |
| Linting    | `eslint-config-next`       | 16.4.3        | `core-web-vitals` + TypeScript flat configs.                               |
| Formatting | `prettier`                 | 3.9.10        | With `prettier-plugin-tailwindcss` 0.8.1.                                  |
| Unit tests | `vitest`                   | 5.0.5         | Vite 8.3.5, jsdom 30.1.3, Testing Library.                                 |
| E2E tests  | `@playwright/test`         | 1.64.1        | Chromium project.                                                          |
| Runtime    | Node.js                    | 24.21.0       | Verified locally; `engines` requires `>=24.15.0`.                          |

### Deliberately deferred dependencies

These versions were verified but **not installed**, because Task 001 has no live integration and
unused runtime dependencies would be dead weight:

| Area           | Package(s)                               | Verified version                       |
| -------------- | ---------------------------------------- | -------------------------------------- |
| AI SDK         | `ai`                                     | 7.0.159                                |
| AI React hooks | `@ai-sdk/react`                          | 4.0.163                                |
| Supabase       | `@supabase/supabase-js`, `@supabase/ssr` | 2.118.0 / 0.12.7                       |
| Retrieval      | `pgvector`                               | Postgres extension, not an npm package |

The AI boundary currently uses framework-neutral contracts in `src/server/ai/provider.ts`. A future
adapter can wrap the Vercel AI SDK without changing feature code. Supabase, migrations, and
`pgvector` are deferred until auth/schema work is approved.

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
│   │   ├── globals.css           # Design tokens + base/component styles
│   │   ├── icon.svg              # App icon
│   │   └── layout.tsx            # Root HTML, fonts, metadata
│   ├── components/
│   │   ├── brand/                # Brand mark and logo
│   │   ├── layout/               # Site header and footer
│   │   └── ui/                   # Shared, feature-agnostic primitives
│   ├── features/                 # Vertical product slices (none yet — see README)
│   ├── lib/                      # Pure shared utilities, env, site config
│   ├── server/                   # Server-only capabilities and contracts
│   │   ├── ai/                   # Provider interface (no implementation yet)
│   │   ├── db/                   # Database rules (no client/schema yet)
│   │   └── documents/            # Source/citation contracts (no pipeline yet)
│   └── test/                     # Vitest setup
├── AGENTS.md                     # Architecture rules and implementation conventions
├── components.json               # shadcn/ui CLI-compatible configuration
├── playwright.config.ts
└── vitest.config.ts
```

### Recommended feature shape

When the first feature is approved, create one vertical slice rather than a UI-only folder:

```text
src/features/<feature>/
├── components/   # UI scoped to the feature
├── server/       # Server actions, use cases, orchestration
├── schemas/      # Validation schemas (add zod with the first real input)
├── types.ts      # Domain types owned by the feature
└── index.ts      # Small public API; other features import only this
```

Routes compose features; features do not import routes. Cross-feature imports go through the public
`index.ts`. Shared primitives are promoted to `src/components/ui` only when at least two features
need the same semantics. See `src/features/README.md` for details.

## Architecture boundaries

```text
src/app (routes) ──► src/features (use cases) ──► src/server (ai · documents · db)
        │                    │
        └──────────► src/components/ui + src/lib ◄──┘
```

- **UI** renders props and calls server actions. It never imports database clients, provider SDKs,
  or secrets.
- **Features** own one capability end to end. They may compose shared UI, pure utilities, and server
  contracts; they may not import routes.
- **Server** contains cross-feature capabilities: AI provider contracts/adapters, document
  extraction and citation logic, and repositories. It must not import React, routes, components, or
  features.
- **Shared UI and `src/lib`** stay pure and feature-agnostic. They must not import `src/server` or
  `src/features`.
- ESLint enforces the import directions that are enforceable today. See `AGENTS.md` for the full
  rules and the definition of done.

The current AI and document modules contain **contracts only**. No provider is called, no file is
parsed, and no table exists.

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

The reference page documents color, type, components, learning-content styles, radii, elevation,
and current accessibility gaps: `/design-system`.

## Environment variables

| Variable                        | Scope       | Status in Task 001                         |
| ------------------------------- | ----------- | ------------------------------------------ |
| `NEXT_PUBLIC_APP_URL`           | Public      | Read; defaults to `http://localhost:3000`. |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public      | Planned; not read yet.                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public      | Planned; not read yet.                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server only | Planned; not read yet. Never expose.       |
| `AI_GATEWAY_API_KEY`            | Server only | Planned; not read yet. Never expose.       |

Copy `.env.example` to `.env.local` and keep real credentials out of git. Do not add a secret to a
`NEXT_PUBLIC_*` variable.

## Testing

```bash
npm run test          # Vitest + Testing Library (jsdom)
npm run test:coverage # V8 coverage; report in ./coverage
npm run test:e2e      # Playwright smoke tests; starts the dev server
```

Coverage is collected but **no thresholds are enforced yet**; meaningful thresholds should arrive
with real domain logic. Playwright runs one Chromium project against
`http://localhost:3000`. In CI, the config builds and starts the production server instead of the dev
server.

**macOS 13 + Playwright 1.64:** Playwright no longer downloads its bundled Chromium on macOS 13.
Use an installed Google Chrome for local e2e runs:

```bash
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

CI and supported hosts should use the normal command after `npx playwright install chromium`.

### Current verification

On 31 October 2026, with Node 24.21.0, the following passed locally:

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run test` — 12 tests across 4 files
- `npm run build`
- `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` — 3 tests

A layout audit at 320/360/390/768/1024/1440 px found no page-level horizontal overflow, no console
errors, no failed requests, and both fonts loaded. This is not a substitute for a visual design
review or a screen-reader audit.

## Security and production notes

- Security headers (`nosniff`, `DENY` framing, strict-origin referrer policy) are set in
  `next.config.ts`. A content security policy is deliberately deferred until the asset and provider
  requirements are known.
- `poweredByHeader` is disabled.
- No authentication, authorization, rate limiting, or data persistence exists yet. Do not deploy
  this as a multi-user service until those are implemented.
- The service-role key must never reach the client or a `NEXT_PUBLIC_*` variable.

## Scope and next steps

Intentionally **not** implemented in Task 001: auth flows, database tables/migrations, live AI
providers, uploads, RAG/pgvector, quizzes, TTS, analytics, and CI workflows.

Task 002 should start only after approval of this foundation. A sensible order:

1. Approve the design system and folder boundaries.
2. Add Supabase auth + schema with RLS, plus repository contracts and integration tests.
3. Add the AI provider adapter behind `AiProvider` with a deterministic test double.
4. Add document ingestion with citation locators, then retrieval and quizzes.
5. Add CI (format, lint, typecheck, unit, build, e2e) and automated accessibility checks.

## License

Private portfolio project. No license has been granted.
