# Supabase

This directory contains the Task 003 learning schema and its database tests.

```
supabase/
├── config.toml                    # Local CLI configuration; no secrets
├── migrations/
│   ├── 20261102090000_create_learning_tables.sql
│   ├── 20261102090100_learning_rls_and_grants.sql
│   └── 20261102090200_provision_profiles.sql
├── seed.sql                       # Intentionally empty for Task 003
└── tests/
    └── learning_database.test.sql # pgTAP integration suite
```

The migrations create `profiles`, `courses`, `study_packs`, and `sources`, enable RLS, apply
column-level grants, add the same-owner foreign keys, and provision profiles from `auth.users`.

## Task 003 migrations

Status: all three migrations are applied to the hosted Dawai project (`romuwmzgwcdqxoeskrkh`). They
are forward-only; do not edit an applied migration. Future schema changes need a new migration.

1. `20261102090000_create_learning_tables.sql` — creates the four tables, checks, indexes,
   `updated_at` triggers, course detachment, and same-owner composite foreign keys.
2. `20261102090100_learning_rls_and_grants.sql` — enables RLS, adds per-operation ownership policies,
   revokes anonymous/default table access, and grants only user-editable columns to authenticated
   callers.
3. `20261102090200_provision_profiles.sql` — creates the signup trigger, removes API-role execution
   from the security-definer trigger function, and backfills profiles for existing auth users.

## Apply to the linked project

The Dawai project is the only approved hosted target. Applying migrations changes production data
and schema, so do this only after review and with explicit approval.

```bash
# Authenticate in your own terminal. Do not paste tokens or passwords into chat.
npx supabase login
npx supabase projects list
npx supabase link --project-ref <dawai-project-ref>
npx supabase migration list --remote
npx supabase db push --remote --dry-run
# STOP: inspect the output and obtain explicit approval before running:
npx supabase db push --remote
```

- `npx supabase projects list` must show the existing **Dawai** project and its ref must match the
  project used by `NEXT_PUBLIC_SUPABASE_URL`. Do not run the next command until that is confirmed.
- `npx supabase link` may prompt for the database password. Enter it only in the CLI prompt; do not
  pass it with `--password` on the command line or paste it into chat. The CLI may offer browser-based
  login; that is the preferred authentication path.
- `npx supabase migration list --remote` is read-only. Compare the remote history with these three
  local files. Do not use `--include-all` unless the history has been reviewed.
- Before a push, use read-only SQL in the project SQL editor to inspect the current schema, migration
  history, and server version:

  ```sql
  select current_setting('server_version');
  select version, name from supabase_migrations.schema_migrations order by version;
  select table_name from information_schema.tables
    where table_schema = 'public' order by table_name;
  ```

  PostgreSQL 15 or newer is required because the course composite foreign key uses
  `ON DELETE SET NULL (course_id)`. Confirm this before applying.

- Check the project's Dashboard backups or PITR recovery window. If no recoverable backup exists,
  take and verify a logical dump before the push. Keep any dump outside the repository.
- `--dry-run` only prints the migrations that would be applied. Inspect it against
  `supabase/migrations/` and the migration history.
- Do not run `npx supabase db reset --remote`, `npx supabase db reset --linked`, or any other
  destructive reset against the hosted project.
- The app does not need a service-role key for these migrations. Do not paste database passwords,
  access tokens, or keys into source, docs, screenshots, or tests.
- If the CLI/credentials are unavailable, report the migration as unapplied. Do not claim hosted RLS
  was verified.

These migrations are forward-only and are not designed to be re-run manually. A failed or partial
application must be investigated through the migration history; do not repair it by rerunning
`create table`, `create policy`, or `grant` statements blindly.

## Local database and tests

Requires Docker and the Supabase CLI:

```bash
npx supabase start
npx supabase db reset
npx supabase test db supabase/tests/learning_database.test.sql
```

`db reset` here is local only and reapplies all migrations plus the empty seed file. The pgTAP suite
creates disposable auth users, exercises RLS as `authenticated` and `anon`, and rolls everything back.
It covers:

- Profile provisioning for new auth users
- Anonymous denial
- Cross-user reads and mutations
- Ownership reassignment denial
- Cross-user course/pack and pack/source association rejection
- Valid owner CRUD
- Course deletion detaching packs, pack deletion cascading sources, and auth-user cascade deletion
- Constraint checks for duplicate course codes, source types, ready-source locators, and blank text

Mocked repository tests in `src/server/db/` verify the TypeScript boundary; they are **not** a
substitute for the database suite. Do not target the shared hosted project with the pgTAP suite: it
creates disposable auth users and relies on transaction rollback. Use the local stack or a dedicated
disposable project.

## Live two-user RLS verification

Use two dedicated test accounts and the publishable key. Never use the service-role key, a database
superuser session, or SQL-editor `postgres` access as evidence that ordinary users are isolated. The
pgTAP suite is useful CI-style coverage; this live procedure proves the deployed HTTP/PostgREST path.

1. Create two dedicated users through the approved app flow or test setup. Use a controlled test
   inbox, not a personal address. Record each user's UUID from the signed-in user response.
2. Create an anonymous client with only the project URL and publishable key.
3. Create user A and user B clients by signing in with their passwords. Do not log the passwords or
   return tokens in terminal output.
4. As A, update the profile, create one course, one pack with the course, one pack without a course,
   and a source in each pack. Confirm owner reads and updates work.
5. As B, attempt to select, update, and delete A's profile and learning rows by ID. Expect zero rows
   or a denied error, not A's data.
6. With the anonymous client, attempt select, insert, update, and delete on all four tables. Expect
   permission denial and no rows.
7. As A, attempt to set `user_id` to B on insert and update, set a profile `id` to B, and use B's
   course or pack ID for an association. Expect permission denial or a foreign-key rejection.
8. Create a new user, sign in as that user, and read the profile row created by the trigger. Confirm
   the profile ID equals the auth user ID.
9. Sign in as an existing pre-migration test account and confirm its profile is readable. For a
   complete count of backfilled rows, use a separate operational check; do not treat an admin count
   as RLS proof.
10. As A, delete one source, delete a course that has a pack, and confirm the pack remains with
    `course_id = null`; then delete the pack and confirm its remaining sources are gone. Confirm B's
    rows are unchanged.
11. As a final cleanup check, delete test auth users through the approved admin/dashboard path and
    verify their rows cascade. This privileged cleanup check verifies FK/cascade behavior only; it
    is not evidence that RLS permits ordinary users to perform the deletion.

Use unique titles and IDs so cross-user assertions cannot pass accidentally. Record expected counts
before and after each mutation. Do not leave test credentials, tokens, or private links in the repo.

## Current verification status

As of 5 November 2026:

- All three migrations are applied to hosted Dawai. Read-only Dashboard checks confirmed the four
  tables, checks, indexes, RLS, 16 per-operation policies, column grants, same-owner foreign keys,
  auth trigger, update triggers, and function privileges.
- A two-user live pass using the publishable key and real Auth/PostgREST sessions passed **68/68**
  checks: profile provisioning, owner CRUD, anonymous denial, cross-user isolation in both
  directions, ownership spoof/reassignment denial, cross-user association rejection, course
  detachment, and pack/source cascades.
- The test auth users were deleted through the Dashboard. Post-deletion checks returned zero test
  users, profiles, and orphan rows.
- `npx supabase test db` could not run in this workspace because Docker/local Postgres is
  unavailable. The 40-assertion suite passed in a disposable in-process PostgreSQL 17 harness with
  simulated `auth.users`/`auth.uid()` roles. That is supporting evidence, not a substitute for the
  official pgTAP command or CI.
