# Database boundary

Task 003 adds the first application schema: `profiles`, `courses`, `study_packs`, and `sources`. The
SQL migrations in `supabase/migrations/` are the source of truth. The TypeScript types in this folder
are application contracts mapped from those rows; they are not generated Supabase client types yet.
Regenerate client types with the Supabase CLI when a linked database is available, then keep the
mappings in sync.

## Schema

| Table         | Ownership                 | Notes                                                                  |
| ------------- | ------------------------- | ---------------------------------------------------------------------- |
| `profiles`    | `id = auth.users.id`      | Display name and JSON learning preferences. No auth secrets or email.  |
| `courses`     | `user_id → auth.users.id` | Optional containers. Course code is unique per user, case-insensitive. |
| `study_packs` | `user_id → auth.users.id` | `course_id` is optional. A pack may exist without a course.            |
| `sources`     | `user_id → auth.users.id` | Always attached to one study pack via a same-owner composite FK.       |

- A study pack's `course_id` is optional and uses a composite foreign key to ensure the course
  belongs to the same user.
- A source's `study_pack_id` is required and uses a composite foreign key to ensure the pack belongs
  to the same user.
- Deleting a course detaches its packs (`ON DELETE SET NULL` for `course_id`). Deleting a pack
  cascades its sources. Deleting the auth user cascades every owned row.
- `sources` stores source type, provenance/locator fields, processing status, and an optional failure
  message. It does not store chunks, embeddings, lessons, or generated content.
- `created_at` and `updated_at` are server-managed. A trigger sets `updated_at` on every update.

## Ownership, grants, and RLS

- `user_id` defaults to `auth.uid()`; repository methods never accept a caller-supplied user ID.
- RLS is enabled on all four tables. Explicit `select`, `insert`, `update`, and `delete` policies only
  allow `authenticated` users to access their own rows.
- Anonymous callers have no table privileges and no policies.
- Table-level privileges are revoked, then `select`/`delete` and column-scoped `insert`/`update`
  access are granted. `id`, `user_id`, `created_at`, and `updated_at` cannot be written by an
  authenticated caller.
- Ownership columns are also checked by RLS on update, so a compromised or alternate client cannot
  reassign a row by editing `user_id`.
- Profile provisioning is an `auth.users` trigger with a minimal `insert ... on conflict do nothing`.
  It does not require a service-role key or an app-side registration step. The migration also
  backfills existing auth users.
- No service-role client exists in this boundary. User-scoped work uses
  `createSupabaseServerClient()` (publishable/anon key plus the user's cookies).

## Repository API

`createLearningRepositories(supabase)` returns:

- `profiles`: `get`, `update`
- `courses`: `list`, `getById`, `create`, `update`, `delete`
- `studyPacks`: `list`, `getById`, `create`, `update`, `delete`
- `sources`: `listByStudyPack`, `getById`, `create`, `update`, `delete`

Inputs are validated with zod before a request is sent. Database errors are mapped to
`RepositoryError` codes (`invalid_input`, `not_found`, `conflict`, `forbidden`, `unavailable`,
`unknown`) with safe messages; raw Postgres/PostgREST messages stay in the internal `cause`.

Rules:

- Create the Supabase client per request and pass it to `createLearningRepositories()`. Never cache
  the client or repositories in module scope.
- Do not add `userId` parameters. Identity comes from the verified JWT and `auth.uid()`.
- Do not import this implementation or Supabase clients into presentation components.
- An update returning `null`, or a delete returning `false`, may mean the row does not exist or is
  invisible under RLS. Callers must present that honestly rather than assuming success.
- The current row types are manually mapped because no linked CLI-generated `Database` type is
  committed. This is a known Task 003 limitation, not a claim that generated types are present.

## Migrations and integration tests

The migration set is:

1. `20261102090000_create_learning_tables.sql` — tables, constraints, indexes, FKs, and update
   triggers.
2. `20261102090100_learning_rls_and_grants.sql` — RLS policies and column-level grants.
3. `20261102090200_provision_profiles.sql` — signup trigger and existing-user backfill.

`supabase/tests/learning_database.test.sql` is a 40-assertion pgTAP suite for profile provisioning,
anonymous denial, cross-user reads and mutations, ownership reassignment, cross-user course/pack
association rejection, valid owner CRUD, constraints, course detachment, and cascades.

Run locally:

```bash
npx supabase start
npx supabase db reset
npx supabase test db supabase/tests/learning_database.test.sql
```

`db reset` is a **local-only** reset. Do not use it against the hosted Dawai project. Applying
migrations to the linked project requires review, credentials, and explicit approval; the exact
command is documented in `README.md` and `supabase/README.md`.

## Known limitations

- The three migrations are applied to the hosted Dawai project, and hosted RLS was verified with two
  dedicated users through Auth/PostgREST (68/68 checks). The test users and their rows were removed;
  cascade and orphan checks returned zero.
- The official `npx supabase test db` command was not available because Docker/local Postgres is
  unavailable. The 40-assertion suite passed in a disposable PostgreSQL 17 harness; no CI database
  job exists yet.
- The TypeScript row mappings are hand-maintained because no generated `Database` type is committed.
- Source processing, storage upload, parsing, chunking, embeddings, retrieval, and generated
  learning content are outside Task 003.
