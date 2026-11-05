-- Provision a minimal profile when an auth user is created.
--
-- The trigger is intentionally small: it inserts only the auth user's primary
-- key and relies on column defaults for the rest. It cannot block registration
-- on optional profile data, and `on conflict` makes the backfill and future
-- retries idempotent. The function is SECURITY DEFINER because auth.users is
-- owned by Supabase Auth; an empty search_path and fully qualified table name
-- keep the definer path narrow. Apply migrations as the table owner (postgres
-- in Supabase) so the definer insert is not filtered by the profiles RLS policy.

create or replace function public.dawai_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.dawai_handle_new_user() is
  'Creates the one-to-one profile row for a new auth user; only inserts the new auth user id.';

drop trigger if exists dawai_provision_profile_on_signup on auth.users;

create trigger dawai_provision_profile_on_signup
  after insert on auth.users
  for each row execute function public.dawai_handle_new_user();

-- Trigger functions do not need API-role EXECUTE privileges. Keep the definer
-- function out of the PostgREST function surface and retain owner execution.
revoke all on function public.dawai_handle_new_user() from public, anon, authenticated;

-- Backfill after the trigger exists so a concurrent signup cannot slip between
-- the backfill and trigger activation. Both paths are idempotent.
insert into public.profiles (id)
select users.id
from auth.users as users
on conflict (id) do nothing;
