# Database boundary

Task 002 implements Supabase Auth only. It does **not** create application
tables, migrations, profiles, or RLS policies. The authenticated identity comes
from Supabase Auth (`user.id`, `user.email`, `user.created_at`, and optional
`user_metadata`), not from an application table.

When application data is approved:

- Put SQL migrations in `supabase/migrations/` and review them like code.
- Add a minimal `profiles` table only if a real query needs it; do not duplicate
  Supabase Auth fields without a reason.
- Enable Row Level Security on every user-owned table before exposing it. Default
  to deny and add explicit policies for `select`, `insert`, `update`, and
  `delete`.
- Access data through repositories in `src/server/db/`; never import Supabase
  clients in components.
- Use the publishable/anon key for user-scoped clients. Keep the service-role key
  server-only and restrict it to trusted, narrow operations.
- Define types from the database schema instead of hand-maintaining duplicates.
- Add integration tests against a disposable local Supabase instance before
  claiming a query works.
- Never trust a user ID supplied by the client. Derive ownership from the
  server-validated session.

`pgvector` retrieval is also deferred. When retrieval lands, embedding storage
and similarity search belong behind this boundary, not in route handlers.
