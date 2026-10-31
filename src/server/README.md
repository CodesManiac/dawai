# Server capabilities

Cross-feature, server-only code lives here. Nothing in this directory may import
React, `src/app`, `src/components`, or `src/features`.

| Folder       | Responsibility                                            | Task 001 state |
| ------------ | --------------------------------------------------------- | -------------- |
| `ai/`        | Model-agnostic provider contracts and future adapters     | Contract only  |
| `documents/` | Extraction, chunking, citation locators, future pipelines | Contract only  |
| `db/`        | Repository interfaces and Supabase access (future)        | Documentation  |

## Rules

1. Never expose provider keys, the service-role key, or raw database clients to
   the browser.
2. Features depend on contracts from this layer through server actions or
   server components. Client components receive plain data.
3. Add a folder here only when at least two features need the capability.
   Otherwise keep it inside the owning feature.
4. Keep vendor SDK imports inside adapters (`ai/`, `db/`) so the rest of the
   codebase stays portable.

No SDKs are installed for these boundaries yet. Authentication, database
tables, document upload, retrieval, and live AI calls are explicitly deferred.
