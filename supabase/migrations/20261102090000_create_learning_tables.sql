-- Learning database foundation: profiles, courses, study packs, and sources.
--
-- Ownership is anchored on auth.users. Application rows never accept a user ID
-- from the client: user_id defaults to auth.uid() and RLS is enabled in the next
-- migration. No chunks, embeddings, generated lessons, or AI-specific data are
-- created here.

-- Keep updated_at server-controlled for every mutable learning table.
create or replace function public.dawai_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.dawai_set_updated_at() is
  'Sets updated_at on updates; created_at and updated_at are not user-editable.';

-- One profile per auth user. The default supports a defensive lazy insert, but
-- the primary provisioning path is the auth.users trigger in the final migration.
create table public.profiles (
  id uuid primary key default auth.uid()
    references auth.users (id) on delete cascade,
  display_name text,
  learning_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length
    check (display_name is null or char_length(btrim(display_name)) between 1 and 80),
  constraint profiles_learning_preferences_object
    check (jsonb_typeof(learning_preferences) = 'object')
);

comment on table public.profiles is
  'User-owned learning preferences. Authentication identity remains in auth.users.';
comment on column public.profiles.id is
  'Equals auth.users.id; set by the profile provisioning trigger or auth.uid() default.';
comment on column public.profiles.learning_preferences is
  'JSON object reserved for future learning preferences; the app owns its shape.';

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  code text,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_title_length
    check (char_length(btrim(title)) between 1 and 200),
  constraint courses_code_length
    check (code is null or char_length(btrim(code)) between 1 and 40),
  constraint courses_description_length
    check (description is null or char_length(description) <= 5000),
  -- Required as the parent key for the same-owner composite foreign key below.
  constraint courses_id_user_id_key unique (id, user_id)
);

comment on table public.courses is
  'Optional user-owned containers for study packs.';
comment on column public.courses.code is
  'Optional course code, unique per user when present (case-insensitive).';
comment on column public.courses.user_id is
  'Ownership is server-controlled; clients cannot insert or update this column.';

create unique index courses_user_id_code_unique_idx
  on public.courses (user_id, lower(btrim(code)))
  where code is not null;

create index courses_user_id_created_at_idx
  on public.courses (user_id, created_at desc);

create table public.study_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  course_id uuid,
  title text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_packs_title_length
    check (char_length(btrim(title)) between 1 and 200),
  constraint study_packs_description_length
    check (description is null or char_length(description) <= 5000),
  constraint study_packs_status_check
    check (status in ('active', 'archived')),
  -- Required as the parent key for the same-owner source foreign key below.
  constraint study_packs_id_user_id_key unique (id, user_id),
  -- A pack may be detached from a course. The composite key rejects attaching a
  -- pack to another user's course even if a client bypasses the repository.
  constraint study_packs_course_owner_fkey
    foreign key (course_id, user_id)
    references public.courses (id, user_id)
    on delete set null (course_id)
);

comment on table public.study_packs is
  'User-owned learning packs. A course association is optional.';
comment on column public.study_packs.status is
  'User lifecycle state; active or archived.';
comment on column public.study_packs.course_id is
  'Optional course. Composite FK requires the course to belong to the same user.';

create index study_packs_user_id_created_at_idx
  on public.study_packs (user_id, created_at desc);

create index study_packs_course_id_idx
  on public.study_packs (course_id)
  where course_id is not null;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  study_pack_id uuid not null,
  source_type text not null,
  title text not null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  failure_message text,
  storage_path text,
  source_url text,
  text_content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sources_title_length
    check (char_length(btrim(title)) between 1 and 200),
  constraint sources_type_check
    check (source_type in ('document', 'text', 'webpage', 'video')),
  constraint sources_status_check
    check (status in ('pending', 'processing', 'ready', 'failed')),
  constraint sources_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  -- Failure information exists only for failed sources, and a failed source
  -- must explain what failed.
  constraint sources_failure_state_check
    check (
      (
        status = 'failed'
        and failure_message is not null
        and char_length(btrim(failure_message)) between 1 and 2000
      )
      or (status <> 'failed' and failure_message is null)
    ),
  -- Each source type owns the locator field that matches it. Pending and
  -- processing rows may be incomplete, but a ready row must have a locator.
  constraint sources_location_type_check
    check (
      (storage_path is null or source_type = 'document')
      and (source_url is null or source_type in ('webpage', 'video'))
      and (text_content is null or source_type = 'text')
    ),
  constraint sources_location_lengths_check
    check (
      (storage_path is null or char_length(btrim(storage_path)) between 1 and 1024)
      and (
        source_url is null
        or (
          char_length(source_url) between 1 and 2048
          and source_url ~* '^https?://[^[:space:]]+$'
        )
      )
      and (text_content is null or (
        char_length(text_content) between 1 and 1000000
        and char_length(btrim(text_content)) >= 1
      ))
    ),
  constraint sources_ready_location_check
    check (
      status <> 'ready'
      or (source_type = 'document' and storage_path is not null)
      or (source_type = 'text' and text_content is not null)
      or (source_type in ('webpage', 'video') and source_url is not null)
    ),
  -- A source belongs to exactly one same-user study pack. Deleting the pack
  -- removes its sources; deleting the auth user cascades through user_id.
  constraint sources_study_pack_owner_fkey
    foreign key (study_pack_id, user_id)
    references public.study_packs (id, user_id)
    on delete cascade
);

comment on table public.sources is
  'User-owned source records attached to a study pack. Processing data is limited to state and failure information.';
comment on column public.sources.source_type is
  'document, text, webpage, or video. The matching locator field is enforced by a check.';
comment on column public.sources.metadata is
  'Arbitrary JSON object for source metadata such as MIME type or duration.';
comment on column public.sources.storage_path is
  'Storage object path for document sources; upload handling is not implemented in Task 003.';
comment on column public.sources.source_url is
  'HTTP(S) URL for webpage and video sources.';
comment on column public.sources.text_content is
  'Pasted text for text sources.';

create index sources_user_id_created_at_idx
  on public.sources (user_id, created_at desc);

create index sources_study_pack_id_created_at_idx
  on public.sources (study_pack_id, created_at desc);

create index sources_study_pack_id_status_idx
  on public.sources (study_pack_id, status);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.dawai_set_updated_at();

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.dawai_set_updated_at();

create trigger study_packs_set_updated_at
  before update on public.study_packs
  for each row execute function public.dawai_set_updated_at();

create trigger sources_set_updated_at
  before update on public.sources
  for each row execute function public.dawai_set_updated_at();
