# Database boundary

Task 001 does not create tables, migrations, or clients.

When database work is approved:

- Put SQL migrations in `supabase/migrations/` and review them like code.
- Enable Row Level Security on every user-owned table before exposing it.
- Access data through repositories in `src/server/db/`; never import Supabase
  clients in components.
- Use the anon key for user-scoped clients. Keep the service-role key server-only
  and restrict it to trusted, narrow operations.
- Define types from the database schema instead of hand-maintaining duplicates.
- Add integration tests against a disposable local Supabase instance before
  claiming a query works.

`pgvector` retrieval is also deferred. When retrieval lands, embedding storage
and similarity search belong behind this boundary, not in route handlers.
