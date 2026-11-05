begin;

set search_path = public, extensions;
create extension if not exists pgtap with schema extensions;

select plan(40);

-- Disposable identities. The profile trigger must run for both.
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user-a@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user-b@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

-- Run expected-denial statements with a caller-controlled SQLSTATE result.
create function public.learning_test_sqlstate(statement text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  execute statement;
  return '00000';
exception when others then
  return SQLSTATE;
end;
$$;

grant execute on function public.learning_test_sqlstate(text) to anon, authenticated;

-- Fixtures are inserted as the test owner; RLS is exercised below as the users.
insert into public.courses (id, user_id, code, title)
values
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'BIO101', 'A biology'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'BIO101', 'B biology');

insert into public.study_packs (id, user_id, course_id, title)
values
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'A cells'),
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'B cells');

insert into public.sources (id, user_id, study_pack_id, source_type, title, text_content)
values
  (
    '77777777-7777-7777-7777-777777777777',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    'text',
    'A notes',
    'Cells are the unit of life.'
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    '22222222-2222-2222-2222-222222222222',
    '66666666-6666-6666-6666-666666666666',
    'text',
    'B notes',
    'Private notes.'
  );

-- Profile provisioning -----------------------------------------------------
select is(
  (select count(*)::int from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  1,
  'signup trigger creates profile A'
);

select is(
  (select count(*)::int from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  1,
  'signup trigger creates profile B'
);

-- Anonymous access ---------------------------------------------------------
set local role anon;
select set_config(
  'test.anon_select',
  public.learning_test_sqlstate('select count(*) from public.courses'),
  true
);
reset role;

select is(
  current_setting('test.anon_select'),
  '42501',
  'anonymous users cannot read learning tables'
);

set local role anon;
select set_config(
  'test.anon_insert',
  public.learning_test_sqlstate(
    'insert into public.courses (title) values (''anonymous course'')'
  ),
  true
);
select set_config(
  'test.anon_update',
  public.learning_test_sqlstate(
    'update public.courses set title = ''anonymous update'''
  ),
  true
);
select set_config(
  'test.anon_delete',
  public.learning_test_sqlstate('delete from public.courses'),
  true
);
reset role;

select is(
  current_setting('test.anon_insert'),
  '42501',
  'anonymous users cannot insert learning rows'
);
select is(
  current_setting('test.anon_update'),
  '42501',
  'anonymous users cannot update learning rows'
);
select is(
  current_setting('test.anon_delete'),
  '42501',
  'anonymous users cannot delete learning rows'
);

-- User A read isolation ----------------------------------------------------
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);
select set_config('test.a_courses', (select count(*)::text from public.courses), true);
select set_config('test.a_packs', (select count(*)::text from public.study_packs), true);
select set_config('test.a_sources', (select count(*)::text from public.sources), true);
select set_config('test.a_profiles', (select count(*)::text from public.profiles), true);
select set_config(
  'test.a_b_course',
  (select count(*)::text from public.courses where id = '44444444-4444-4444-4444-444444444444'),
  true
);
select set_config(
  'test.a_b_pack',
  (select count(*)::text from public.study_packs where id = '66666666-6666-6666-6666-666666666666'),
  true
);
select set_config(
  'test.a_b_source',
  (select count(*)::text from public.sources where id = '88888888-8888-8888-8888-888888888888'),
  true
);
select set_config(
  'test.a_b_profile',
  (select count(*)::text from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  true
);
reset role;

select is(current_setting('test.a_courses')::int, 1, 'A sees only their own courses');
select is(current_setting('test.a_packs')::int, 1, 'A sees only their own study packs');
select is(current_setting('test.a_sources')::int, 1, 'A sees only their own sources');
select is(current_setting('test.a_profiles')::int, 1, 'A sees only their own profile');
select is(current_setting('test.a_b_course')::int, 0, 'A cannot read B courses by id');
select is(current_setting('test.a_b_pack')::int, 0, 'A cannot read B study packs by id');
select is(current_setting('test.a_b_source')::int, 0, 'A cannot read B sources by id');
select is(current_setting('test.a_b_profile')::int, 0, 'A cannot read B profile by id');

-- User A update/delete isolation ------------------------------------------
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);
with changed as (
  update public.courses
  set title = 'hijacked'
  where id = '44444444-4444-4444-4444-444444444444'
  returning 1
)
select set_config('test.b_course_update', (select count(*)::text from changed), true);

with changed as (
  delete from public.courses
  where id = '44444444-4444-4444-4444-444444444444'
  returning 1
)
select set_config('test.b_course_delete', (select count(*)::text from changed), true);

with changed as (
  update public.study_packs
  set title = 'hijacked'
  where id = '66666666-6666-6666-6666-666666666666'
  returning 1
)
select set_config('test.b_pack_update', (select count(*)::text from changed), true);

with changed as (
  delete from public.study_packs
  where id = '66666666-6666-6666-6666-666666666666'
  returning 1
)
select set_config('test.b_pack_delete', (select count(*)::text from changed), true);

with changed as (
  update public.sources
  set title = 'hijacked'
  where id = '88888888-8888-8888-8888-888888888888'
  returning 1
)
select set_config('test.b_source_update', (select count(*)::text from changed), true);

with changed as (
  delete from public.sources
  where id = '88888888-8888-8888-8888-888888888888'
  returning 1
)
select set_config('test.b_source_delete', (select count(*)::text from changed), true);

with changed as (
  update public.profiles
  set display_name = 'hijacked'
  where id = '22222222-2222-2222-2222-222222222222'
  returning 1
)
select set_config('test.b_profile_update', (select count(*)::text from changed), true);

with changed as (
  delete from public.profiles
  where id = '22222222-2222-2222-2222-222222222222'
  returning 1
)
select set_config('test.b_profile_delete', (select count(*)::text from changed), true);
reset role;

select is(current_setting('test.b_course_update')::int, 0, 'A cannot update B courses');
select is(current_setting('test.b_course_delete')::int, 0, 'A cannot delete B courses');
select is(current_setting('test.b_pack_update')::int, 0, 'A cannot update B study packs');
select is(current_setting('test.b_pack_delete')::int, 0, 'A cannot delete B study packs');
select is(current_setting('test.b_source_update')::int, 0, 'A cannot update B sources');
select is(current_setting('test.b_source_delete')::int, 0, 'A cannot delete B sources');
select is(current_setting('test.b_profile_update')::int, 0, 'A cannot update B profile');
select is(current_setting('test.b_profile_delete')::int, 0, 'A cannot delete B profile');

-- Ownership reassignment and cross-user relationships ---------------------
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);
select set_config(
  'test.reassign_course',
  public.learning_test_sqlstate(
    'update public.courses set user_id = ''22222222-2222-2222-2222-222222222222'' where id = ''33333333-3333-3333-3333-333333333333'''
  ),
  true
);
select set_config(
  'test.spoof_course_owner',
  public.learning_test_sqlstate(
    'insert into public.courses (user_id, title) values (''22222222-2222-2222-2222-222222222222'', ''spoofed owner'')'
  ),
  true
);
select set_config(
  'test.cross_course_insert',
  public.learning_test_sqlstate(
    'insert into public.study_packs (course_id, title) values (''44444444-4444-4444-4444-444444444444'', ''cross-user'')'
  ),
  true
);
select set_config(
  'test.cross_course_update',
  public.learning_test_sqlstate(
    'update public.study_packs set course_id = ''44444444-4444-4444-4444-444444444444'' where id = ''55555555-5555-5555-5555-555555555555'''
  ),
  true
);
select set_config(
  'test.cross_pack_insert',
  public.learning_test_sqlstate(
    'insert into public.sources (study_pack_id, source_type, title, text_content) values (''66666666-6666-6666-6666-666666666666'', ''text'', ''cross-user'', ''text'')'
  ),
  true
);
select set_config(
  'test.cross_pack_update',
  public.learning_test_sqlstate(
    'update public.sources set study_pack_id = ''66666666-6666-6666-6666-666666666666'' where id = ''77777777-7777-7777-7777-777777777777'''
  ),
  true
);
reset role;

select is(current_setting('test.reassign_course'), '42501', 'ownership columns cannot be updated');
select is(
  current_setting('test.spoof_course_owner'),
  '42501',
  'ownership columns cannot be supplied on insert'
);
select is(
  current_setting('test.cross_course_insert'),
  '23503',
  'study pack insert cannot attach another user''s course'
);
select is(
  current_setting('test.cross_course_update'),
  '23503',
  'study pack update cannot attach another user''s course'
);
select is(
  current_setting('test.cross_pack_insert'),
  '23503',
  'source insert cannot attach another user''s pack'
);
select is(
  current_setting('test.cross_pack_update'),
  '23503',
  'source update cannot attach another user''s pack'
);

-- Database constraints -----------------------------------------------------
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);
select set_config(
  'test.duplicate_code',
  public.learning_test_sqlstate(
    'insert into public.courses (code, title) values (''BIO101'', ''duplicate'')'
  ),
  true
);
select set_config(
  'test.invalid_type',
  public.learning_test_sqlstate(
    'insert into public.sources (study_pack_id, source_type, title) values (''55555555-5555-5555-5555-555555555555'', ''audio'', ''invalid'')'
  ),
  true
);
select set_config(
  'test.invalid_ready',
  public.learning_test_sqlstate(
    'insert into public.sources (study_pack_id, source_type, title, status) values (''55555555-5555-5555-5555-555555555555'', ''text'', ''invalid ready'', ''ready'')'
  ),
  true
);
select set_config(
  'test.whitespace_text',
  public.learning_test_sqlstate(
    'insert into public.sources (study_pack_id, source_type, title, text_content) values (''55555555-5555-5555-5555-555555555555'', ''text'', ''blank text'', ''   '')'
  ),
  true
);
reset role;

select is(current_setting('test.duplicate_code'), '23505', 'course codes are unique per user');
select is(current_setting('test.invalid_type'), '23514', 'invalid source types are rejected');
select is(
  current_setting('test.invalid_ready'),
  '23514',
  'a ready source requires its matching locator'
);
select is(
  current_setting('test.whitespace_text'),
  '23514',
  'whitespace-only source text is rejected'
);

-- Valid owner CRUD and defaults -------------------------------------------
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);

with inserted as (
  insert into public.courses (code, title, description)
  values ('NEW101', 'A new course', 'created by A')
  returning id
)
select set_config('test.new_course', id::text, true) from inserted;

with inserted as (
  insert into public.study_packs (course_id, title)
  values (current_setting('test.new_course')::uuid, 'A new pack')
  returning id
)
select set_config('test.new_pack', id::text, true) from inserted;

with inserted as (
  insert into public.sources (study_pack_id, source_type, title, text_content)
  values (current_setting('test.new_pack')::uuid, 'text', 'A new source', 'owner content')
  returning id
)
select set_config('test.new_source', id::text, true) from inserted;

with changed as (
  update public.courses
  set title = 'Updated by A'
  where id = current_setting('test.new_course')::uuid
  returning 1
)
select set_config('test.own_course_update', (select count(*)::text from changed), true);

select set_config(
  'test.own_course_title',
  (select title from public.courses where id = current_setting('test.new_course')::uuid),
  true
);

with removed as (
  delete from public.sources
  where id = current_setting('test.new_source')::uuid
  returning 1
)
select set_config('test.own_source_delete', (select count(*)::text from removed), true);

with inserted as (
  insert into public.sources (study_pack_id, source_type, title, text_content)
  values (current_setting('test.new_pack')::uuid, 'text', 'A second source', 'more content')
  returning id
)
select set_config('test.second_source', id::text, true) from inserted;

with removed as (
  delete from public.courses
  where id = current_setting('test.new_course')::uuid
  returning 1
)
select set_config('test.own_course_delete', (select count(*)::text from removed), true);
reset role;

select ok(
  current_setting('test.new_course') <> ''
    and current_setting('test.new_pack') <> ''
    and current_setting('test.new_source') <> '',
  'A can create own course, pack, and source through auth defaults'
);
select is(
  current_setting('test.own_course_update')::int,
  1,
  'A can update own course'
);
select is(
  current_setting('test.own_course_title'),
  'Updated by A',
  'A course update persisted'
);
select is(
  current_setting('test.own_source_delete')::int,
  1,
  'A can delete own source'
);

select is(
  (select course_id from public.study_packs where id = current_setting('test.new_pack')::uuid),
  null::uuid,
  'deleting a course detaches its pack'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}',
  true
);
with removed as (
  delete from public.study_packs
  where id = current_setting('test.new_pack')::uuid
  returning 1
)
select set_config('test.own_pack_delete', (select count(*)::text from removed), true);
reset role;

select is(current_setting('test.own_pack_delete')::int, 1, 'A can delete own pack');
select is(
  (select count(*)::int from public.sources where id = current_setting('test.second_source')::uuid),
  0,
  'deleting a pack cascades its sources'
);

-- Auth deletion cascade ----------------------------------------------------
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';

select ok(
  (select count(*) from public.profiles where id = '11111111-1111-1111-1111-111111111111') = 0
    and (select count(*) from public.courses where user_id = '11111111-1111-1111-1111-111111111111') = 0
    and (select count(*) from public.study_packs where user_id = '11111111-1111-1111-1111-111111111111') = 0
    and (select count(*) from public.sources where user_id = '11111111-1111-1111-1111-111111111111') = 0,
  'deleting an auth user cascades profile, courses, packs, and sources'
);

select * from finish();
rollback;
