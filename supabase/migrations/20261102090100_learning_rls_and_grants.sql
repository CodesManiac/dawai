-- Row Level Security and least-privilege grants for the learning tables.
--
-- Every application table is deny-by-default for anonymous callers. Authenticated
-- users may only see or mutate rows they own. Ownership columns are not in the
-- column-level INSERT/UPDATE grants, so clients cannot set them directly; user_id
-- is filled from the verified JWT by auth.uid(). RLS is still the final boundary.

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.study_packs enable row level security;
alter table public.sources enable row level security;

-- Profiles -----------------------------------------------------------------
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_delete_own
  on public.profiles
  for delete
  to authenticated
  using (id = (select auth.uid()));

comment on policy profiles_select_own on public.profiles is
  'A user can read only their own profile.';
comment on policy profiles_insert_own on public.profiles is
  'A user can create only a profile whose id equals auth.uid().';
comment on policy profiles_update_own on public.profiles is
  'A user can update only their own profile and cannot move it to another user.';
comment on policy profiles_delete_own on public.profiles is
  'A user can delete only their own profile; auth-user deletion also cascades.';

-- Courses ------------------------------------------------------------------
create policy courses_select_own
  on public.courses
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy courses_insert_own
  on public.courses
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy courses_update_own
  on public.courses
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy courses_delete_own
  on public.courses
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

comment on policy courses_select_own on public.courses is
  'A user can list and read only their own courses.';
comment on policy courses_insert_own on public.courses is
  'The inserted row must be owned by auth.uid().';
comment on policy courses_update_own on public.courses is
  'A user can update only their own courses and cannot reassign ownership.';
comment on policy courses_delete_own on public.courses is
  'A user can delete only their own courses.';

-- Study packs ---------------------------------------------------------------
create policy study_packs_select_own
  on public.study_packs
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy study_packs_insert_own
  on public.study_packs
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy study_packs_update_own
  on public.study_packs
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy study_packs_delete_own
  on public.study_packs
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

comment on policy study_packs_select_own on public.study_packs is
  'A user can list and read only their own study packs.';
comment on policy study_packs_insert_own on public.study_packs is
  'The inserted pack must be owned by auth.uid(); the composite FK also checks course ownership.';
comment on policy study_packs_update_own on public.study_packs is
  'A user can update only their own packs and cannot reassign ownership.';
comment on policy study_packs_delete_own on public.study_packs is
  'A user can delete only their own study packs; sources cascade.';

-- Sources ------------------------------------------------------------------
create policy sources_select_own
  on public.sources
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy sources_insert_own
  on public.sources
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy sources_update_own
  on public.sources
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy sources_delete_own
  on public.sources
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

comment on policy sources_select_own on public.sources is
  'A user can list and read only their own sources.';
comment on policy sources_insert_own on public.sources is
  'The inserted source must be owned by auth.uid(); the composite FK also checks pack ownership.';
comment on policy sources_update_own on public.sources is
  'A user can update only their own sources and cannot reassign ownership.';
comment on policy sources_delete_own on public.sources is
  'A user can delete only their own sources.';

-- Least-privilege grants ----------------------------------------------------
-- Start from no access, then grant only the operations and columns a user may
-- control. System fields (id, user_id, created_at, updated_at) are intentionally
-- absent from UPDATE grants; they are filled by defaults or the update trigger.
revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.courses from public, anon, authenticated;
revoke all on table public.study_packs from public, anon, authenticated;
revoke all on table public.sources from public, anon, authenticated;

grant select, delete on table public.profiles to authenticated;
grant insert (id, display_name, learning_preferences)
  on table public.profiles to authenticated;
grant update (display_name, learning_preferences)
  on table public.profiles to authenticated;

grant select, delete on table public.courses to authenticated;
grant insert (title, code, description)
  on table public.courses to authenticated;
grant update (title, code, description)
  on table public.courses to authenticated;

grant select, delete on table public.study_packs to authenticated;
grant insert (course_id, title, description, status)
  on table public.study_packs to authenticated;
grant update (course_id, title, description, status)
  on table public.study_packs to authenticated;

grant select, delete on table public.sources to authenticated;
grant insert (
  study_pack_id,
  source_type,
  title,
  metadata,
  status,
  failure_message,
  storage_path,
  source_url,
  text_content
) on table public.sources to authenticated;
grant update (
  study_pack_id,
  source_type,
  title,
  metadata,
  status,
  failure_message,
  storage_path,
  source_url,
  text_content
) on table public.sources to authenticated;

-- Anonymous callers have no table privileges and no policies. Authenticated
-- callers still pass the RLS policies above; grants alone are not sufficient.
