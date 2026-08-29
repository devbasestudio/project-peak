-- Project Peak: production schema, security, program engine, storage and seed data.
-- Designed for Supabase Postgres. All customer-facing dates are phone-local ISO text;
-- server timestamps exist only for auditing and ordering.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create extension if not exists pgcrypto with schema extensions;

create type public.locale_code as enum ('mm', 'en');
create type public.template_status as enum ('draft', 'published', 'archived');
create type public.order_status as enum ('awaiting_payment', 'submitted', 'approved', 'rejected', 'cancelled');
create type public.program_status as enum ('pending', 'active', 'paused', 'completed', 'revoked');
create type public.day_type as enum ('push', 'pull', 'challenge');
create type public.assessment_kind as enum ('baseline', 'final');
create type public.record_status as enum ('in_progress', 'completed');
create type public.asset_kind as enum ('image', 'video', 'pdf', 'file');
create type public.lesson_action as enum ('viewed', 'skipped');

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  preferred_locale public.locale_code not null default 'mm',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table private.admin_users enable row level security;

create or replace function private.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null
    and exists (select 1 from private.admin_users a where a.user_id = p_user_id);
$$;

revoke all on function private.is_admin(uuid) from public;
grant execute on function private.is_admin(uuid) to authenticated;
grant usage on schema private to authenticated;

create policy admin_users_self_read
on private.admin_users for select to authenticated
using ((select auth.uid()) = user_id);

create view public.admin_users
with (security_invoker = true)
as
select auth.uid() as user_id, now() as created_at
where private.is_admin();

create or replace function public.bootstrap_first_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from private.admin_users) then
    raise exception 'An administrator is already configured' using errcode = '55000';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Auth user not found';
  end if;
  insert into private.admin_users(user_id, created_by) values (p_user_id, p_user_id);
end;
$$;

revoke all on function public.bootstrap_first_admin(uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_first_admin(uuid) to service_role;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, preferred_locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    case when new.raw_user_meta_data ->> 'preferred_locale' = 'en' then 'en'::public.locale_code else 'mm'::public.locale_code end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  object_path text not null,
  kind public.asset_kind not null,
  mime_type text not null,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  checksum_sha256 text,
  alt_mm text,
  alt_en text,
  uploaded_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (bucket_id, object_path)
);

create table public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.site_pages(id) on delete cascade,
  version_no integer not null default 1 check (version_no > 0),
  status public.template_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_id, version_no)
);

create unique index site_page_one_published
on public.site_page_versions(page_id) where status = 'published';

create table public.site_blocks (
  id uuid primary key default gen_random_uuid(),
  site_page_version_id uuid not null references public.site_page_versions(id) on delete cascade,
  parent_id uuid references public.site_blocks(id) on delete cascade,
  position numeric(12,4) not null,
  block_type text not null,
  content_mm jsonb not null default '{}'::jsonb,
  content_en jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  asset_id uuid references public.media_assets(id) on delete restrict,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index site_blocks_order_idx on public.site_blocks(site_page_version_id, parent_id, position);

create table public.program_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_mm text not null,
  name_en text not null,
  description_mm text,
  description_en text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.program_templates(id) on delete cascade,
  version_no integer not null default 1 check (version_no > 0),
  status public.template_status not null default 'draft',
  name_mm text,
  name_en text,
  published_at timestamptz,
  checksum_sha256 text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, version_no)
);

create unique index template_one_published
on public.template_versions(template_id) where status = 'published';

create table public.template_documents (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.template_versions(id) on delete cascade,
  screen_key text not null,
  day_number smallint check (day_number between 1 and 48),
  title_mm text,
  title_en text,
  position smallint not null default 1 check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index template_documents_key_idx
on public.template_documents(template_version_id, screen_key, coalesce(day_number, 0));

create table public.template_blocks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.template_documents(id) on delete cascade,
  parent_id uuid references public.template_blocks(id) on delete cascade,
  position numeric(12,4) not null,
  block_type text not null check (block_type in ('heading','rich_text','callout','divider','spacer','image','video','pdf','file','timer','checklist','stat','button','link','columns','exercise_cue')),
  title_mm text,
  title_en text,
  content_mm jsonb not null default '{}'::jsonb,
  content_en jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  asset_id uuid references public.media_assets(id) on delete restrict,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index template_blocks_order_idx on public.template_blocks(document_id, parent_id, position);

create table public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.template_versions(id) on delete cascade,
  slug text not null,
  name_mm text not null,
  name_en text not null,
  cue_mm text,
  cue_en text,
  video_asset_id uuid references public.media_assets(id) on delete restrict,
  pattern text,
  equipment_mm text,
  equipment_en text,
  kg_increment numeric(7,2) not null default 0 check (kg_increment >= 0),
  is_big_four boolean not null default false,
  unilateral boolean not null default false,
  body_part text check (body_part is null or body_part in ('upper','lower','core','full')),
  is_assessment_only boolean not null default false,
  position smallint not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_version_id, slug),
  unique (template_version_id, position)
);

create table public.template_days (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.template_versions(id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 48),
  day_type public.day_type not null,
  phase smallint not null check (phase in (1, 2)),
  title_mm text,
  title_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_version_id, day_number)
);

create table public.template_day_items (
  id uuid primary key default gen_random_uuid(),
  template_day_id uuid not null references public.template_days(id) on delete cascade,
  template_exercise_id uuid not null references public.template_exercises(id) on delete restrict,
  position smallint not null check (position > 0),
  sets smallint not null check (sets between 1 and 20),
  reps_min smallint not null check (reps_min between 0 and 999),
  reps_max smallint not null check (reps_max between reps_min and 999),
  target_kg numeric(7,2) not null default 0 check (target_kg >= 0),
  rest_seconds integer not null default 30 check (rest_seconds between 0 and 3600),
  effort text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_day_id, position),
  unique (template_day_id, template_exercise_id)
);

create table public.template_day_assets (
  id uuid primary key default gen_random_uuid(),
  template_day_id uuid not null references public.template_days(id) on delete cascade,
  position smallint not null default 1 check (position > 0),
  kind public.asset_kind not null check (kind in ('video','pdf')),
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  title_mm text not null,
  title_en text not null,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_day_id, position)
);

create table public.template_assessment_movements (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.template_versions(id) on delete cascade,
  assessment_kind public.assessment_kind not null,
  position smallint not null check (position > 0),
  name_mm text not null,
  name_en text not null,
  equipment_mm text,
  equipment_en text,
  rest_seconds integer not null default 180 check (rest_seconds between 0 and 3600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_version_id, assessment_kind, position)
);

create table public.template_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  template_version_id uuid not null references public.template_versions(id) on delete cascade,
  position smallint not null check (position > 0),
  question_mm text not null,
  question_en text not null,
  explanation_mm text,
  explanation_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_version_id, position)
);

create table public.template_quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.template_quiz_questions(id) on delete cascade,
  position smallint not null check (position > 0),
  text_mm text not null,
  text_en text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (question_id, position)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.program_templates(id) on delete restrict,
  slug text not null unique,
  name_mm text not null,
  name_en text not null,
  price_minor bigint not null check (price_minor > 0),
  currency text not null default 'MMK' check (currency = 'MMK'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_instructions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers(id) on delete cascade,
  method text not null default 'kpay',
  recipient_handle text,
  account_name text,
  account_number text,
  qr_asset_id uuid references public.media_assets(id) on delete restrict,
  instructions_mm text,
  instructions_en text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  offer_id uuid not null references public.offers(id) on delete restrict,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null default 'MMK' check (currency = 'MMK'),
  reference_code text not null unique,
  status public.order_status not null default 'awaiting_payment',
  customer_note text,
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payment_one_open_order_per_user
on public.payment_orders(user_id)
where status in ('awaiting_payment', 'submitted', 'approved');

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.payment_orders(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  checksum_sha256 text,
  created_at timestamptz not null default now()
);

create table public.payment_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.payment_orders(id) on delete cascade,
  reviewer_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  from_status public.order_status not null,
  to_status public.order_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.program_status not null default 'pending',
  name_mm text not null,
  name_en text not null,
  source_template_id uuid,
  source_template_version integer,
  approved_order_id uuid unique references public.payment_orders(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  activated_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index programs_one_live_per_user
on public.programs(user_id) where status in ('pending','active','paused');

create table public.program_documents (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  source_template_document_id uuid,
  screen_key text not null,
  day_number smallint check (day_number between 1 and 48),
  title_mm text,
  title_en text,
  position smallint not null default 1,
  created_at timestamptz not null default now(),
  unique (program_id, screen_key, day_number)
);

create table public.program_blocks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  document_id uuid not null references public.program_documents(id) on delete cascade,
  source_template_block_id uuid,
  parent_id uuid references public.program_blocks(id) on delete cascade,
  position numeric(12,4) not null,
  block_type text not null,
  title_mm text,
  title_en text,
  content_mm jsonb not null default '{}'::jsonb,
  content_en jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  asset_id uuid references public.media_assets(id) on delete restrict,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index program_blocks_order_idx on public.program_blocks(document_id, parent_id, position);

create table public.program_exercises (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  source_template_exercise_id uuid,
  slug text not null,
  name_mm text not null,
  name_en text not null,
  cue_mm text,
  cue_en text,
  video_asset_id uuid references public.media_assets(id) on delete restrict,
  pattern text,
  equipment_mm text,
  equipment_en text,
  kg_increment numeric(7,2) not null default 0 check (kg_increment >= 0),
  is_big_four boolean not null default false,
  unilateral boolean not null default false,
  body_part text,
  is_assessment_only boolean not null default false,
  position smallint not null,
  created_at timestamptz not null default now(),
  unique (program_id, slug),
  unique (program_id, position)
);

create table public.program_days (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  source_template_day_id uuid,
  day_number smallint not null check (day_number between 1 and 48),
  day_type public.day_type not null,
  phase smallint not null check (phase in (1, 2)),
  title_mm text,
  title_en text,
  created_at timestamptz not null default now(),
  unique (program_id, day_number)
);

create table public.program_day_items (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  program_exercise_id uuid not null references public.program_exercises(id) on delete restrict,
  source_template_day_item_id uuid,
  position smallint not null,
  sets smallint not null check (sets between 1 and 20),
  reps_min smallint not null check (reps_min between 0 and 999),
  reps_max smallint not null check (reps_max between reps_min and 999),
  target_kg numeric(7,2) not null default 0 check (target_kg >= 0),
  rest_seconds integer not null check (rest_seconds between 0 and 3600),
  effort text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_day_id, position),
  unique (program_day_id, program_exercise_id)
);

create table public.program_day_assets (
  id uuid primary key default gen_random_uuid(),
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  source_template_day_asset_id uuid,
  position smallint not null,
  kind public.asset_kind not null check (kind in ('video','pdf')),
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  title_mm text not null,
  title_en text not null,
  duration_seconds integer,
  created_at timestamptz not null default now(),
  unique (program_day_id, position)
);

create table public.program_assessment_movements (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  source_template_movement_id uuid,
  assessment_kind public.assessment_kind not null,
  position smallint not null,
  name_mm text not null,
  name_en text not null,
  equipment_mm text,
  equipment_en text,
  rest_seconds integer not null default 180,
  created_at timestamptz not null default now(),
  unique (program_id, assessment_kind, position)
);

create table public.program_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  source_template_question_id uuid,
  position smallint not null,
  question_mm text not null,
  question_en text not null,
  explanation_mm text,
  explanation_en text,
  created_at timestamptz not null default now(),
  unique (program_id, position)
);

create table public.program_quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.program_quiz_questions(id) on delete cascade,
  source_template_option_id uuid,
  position smallint not null,
  text_mm text not null,
  text_en text not null,
  created_at timestamptz not null default now(),
  unique (question_id, position)
);

create table private.program_quiz_keys (
  question_id uuid primary key references public.program_quiz_questions(id) on delete cascade,
  correct_option_id uuid not null references public.program_quiz_options(id) on delete cascade
);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 48),
  session_type public.day_type not null,
  status public.record_status not null default 'in_progress',
  local_date text not null check (local_date ~ '^\d{4}-\d{2}-\d{2}$'),
  local_time text check (local_time is null or local_time ~ '^\d{2}:\d{2}(:\d{2})?$'),
  mutation_id uuid unique,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, day_number)
);

create unique index workout_one_completed_local_day
on public.workout_sessions(program_id, local_date) where status = 'completed';

create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  program_day_item_id uuid not null references public.program_day_items(id) on delete restrict,
  set_index smallint not null check (set_index between 1 and 20),
  weight_kg numeric(7,2) not null check (weight_kg >= 0),
  reps smallint not null check (reps between 0 and 999),
  mutation_id uuid not null unique,
  local_time text check (local_time is null or local_time ~ '^\d{1,2}:\d{2}(:\d{2})?$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, program_day_item_id, set_index)
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  local_date text not null check (local_date ~ '^\d{4}-\d{2}-\d{2}$'),
  protein boolean not null default false,
  water boolean not null default false,
  sleep_hours numeric(4,1) check (sleep_hours is null or sleep_hours between 0 and 24),
  mutation_id uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, local_date)
);

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  kind public.assessment_kind not null,
  status public.record_status not null default 'in_progress',
  local_date text not null check (local_date ~ '^\d{4}-\d{2}-\d{2}$'),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, kind)
);

create table public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  movement_id uuid not null references public.program_assessment_movements(id) on delete restrict,
  value integer not null check (value between 0 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, movement_id)
);

create table public.lesson_receipts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  program_day_asset_id uuid not null references public.program_day_assets(id) on delete cascade,
  session_id uuid references public.workout_sessions(id) on delete set null,
  action public.lesson_action not null,
  local_date text not null check (local_date ~ '^\d{4}-\d{2}-\d{2}$'),
  created_at timestamptz not null default now(),
  unique (user_id, program_day_asset_id)
);

create table public.milestone_receipts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  event_key text not null,
  local_date text not null check (local_date ~ '^\d{4}-\d{2}-\d{2}$'),
  seen_at timestamptz not null default now(),
  unique (program_id, event_key)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  status public.record_status not null default 'in_progress',
  local_date text not null check (local_date ~ '^\d{4}-\d{2}-\d{2}$'),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id)
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.program_quiz_questions(id) on delete cascade,
  option_id uuid not null references public.program_quiz_options(id) on delete restrict,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  local_date text not null check (local_date ~ '^\d{4}-\d{2}-\d{2}$'),
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create table public.progression_events (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  program_exercise_id uuid not null references public.program_exercises(id) on delete restrict,
  old_target_kg numeric(7,2) not null,
  new_target_kg numeric(7,2) not null,
  created_at timestamptz not null default now(),
  unique (session_id, program_exercise_id)
);

create table public.sync_receipts (
  mutation_id uuid primary key,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  received_at timestamptz not null default now()
);

-- Backfill profiles for users created before this migration.
insert into public.profiles (id, display_name, avatar_url, preferred_locale)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', split_part(coalesce(u.email, ''), '@', 1)),
  u.raw_user_meta_data ->> 'avatar_url',
  case when u.raw_user_meta_data ->> 'preferred_locale' = 'en' then 'en'::public.locale_code else 'mm'::public.locale_code end
from auth.users u
on conflict (id) do nothing;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','site_pages','site_page_versions','site_blocks','program_templates',
    'template_versions','template_documents','template_blocks','template_exercises',
    'template_days','template_day_items','template_day_assets','template_assessment_movements',
    'template_quiz_questions','template_quiz_options','offers','payment_instructions',
    'payment_orders','programs','program_day_items','workout_sessions','set_logs','habit_logs',
    'assessment_attempts','assessment_results','quiz_attempts'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function private.set_updated_at()',
      table_name, table_name
    );
  end loop;
end;
$$;

create or replace function private.assert_direct_template_draft()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_version_id uuid;
begin
  if tg_op = 'DELETE' then v_version_id := old.template_version_id; else v_version_id := new.template_version_id; end if;
  if not exists (
    select 1 from public.template_versions v
    where v.id = v_version_id and v.status = 'draft'
  ) then
    raise exception 'Only draft template versions may be edited' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function private.assert_template_document_draft()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_document_id uuid;
begin
  if tg_op = 'DELETE' then v_document_id := old.document_id; else v_document_id := new.document_id; end if;
  if not exists (
    select 1
    from public.template_documents d
    join public.template_versions v on v.id = d.template_version_id
    where d.id = v_document_id and v.status = 'draft'
  ) then
    raise exception 'Only blocks in draft template versions may be edited' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function private.assert_template_day_draft()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_day_id uuid;
begin
  if tg_op = 'DELETE' then v_day_id := old.template_day_id; else v_day_id := new.template_day_id; end if;
  if not exists (
    select 1
    from public.template_days d
    join public.template_versions v on v.id = d.template_version_id
    where d.id = v_day_id and v.status = 'draft'
  ) then
    raise exception 'Only rows in draft template versions may be edited' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create or replace function private.assert_template_question_draft()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_question_id uuid;
begin
  if tg_op = 'DELETE' then v_question_id := old.question_id; else v_question_id := new.question_id; end if;
  if not exists (
    select 1
    from public.template_quiz_questions q
    join public.template_versions v on v.id = q.template_version_id
    where q.id = v_question_id and v.status = 'draft'
  ) then
    raise exception 'Only options in draft template versions may be edited' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'template_documents','template_exercises','template_days',
    'template_assessment_movements','template_quiz_questions'
  ]
  loop
    execute format(
      'create trigger %I_draft_only before insert or update or delete on public.%I for each row execute function private.assert_direct_template_draft()',
      table_name, table_name
    );
  end loop;
end;
$$;

create trigger template_blocks_draft_only
before insert or update or delete on public.template_blocks
for each row execute function private.assert_template_document_draft();

create trigger template_day_items_draft_only
before insert or update or delete on public.template_day_items
for each row execute function private.assert_template_day_draft();

create trigger template_day_assets_draft_only
before insert or update or delete on public.template_day_assets
for each row execute function private.assert_template_day_draft();

create trigger template_quiz_options_draft_only
before insert or update or delete on public.template_quiz_options
for each row execute function private.assert_template_question_draft();

create or replace function private.validate_and_protect_template_version()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_day_count integer;
  v_baseline_count integer;
  v_final_count integer;
  v_invalid_questions integer;
begin
  if old.status = 'published' then
    if new.status <> 'archived'
       or (to_jsonb(new) - array['status','updated_at']) <> (to_jsonb(old) - array['status','updated_at']) then
      raise exception 'Published template versions are immutable; clone a new draft' using errcode = '55000';
    end if;
  end if;

  if old.status = 'draft' and new.status = 'published' then
    select count(*) into v_day_count from public.template_days where template_version_id = old.id;
    select count(*) into v_baseline_count from public.template_assessment_movements where template_version_id = old.id and assessment_kind = 'baseline';
    select count(*) into v_final_count from public.template_assessment_movements where template_version_id = old.id and assessment_kind = 'final';
    select count(*) into v_invalid_questions
    from public.template_quiz_questions q
    where q.template_version_id = old.id
      and (select count(*) from public.template_quiz_options o where o.question_id = q.id and o.is_correct) <> 1;

    if v_day_count <> 48 then
      raise exception 'A published program must contain exactly 48 days (found %)', v_day_count;
    end if;
    if v_baseline_count < 1 or v_final_count < 1 then
      raise exception 'A published program needs baseline and final assessment movements';
    end if;
    if v_invalid_questions > 0 then
      raise exception 'Every quiz question must have exactly one correct option';
    end if;
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger template_version_publish_guard
before update on public.template_versions
for each row execute function private.validate_and_protect_template_version();

create or replace function private.protect_payment_order_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_admin() then
    return new;
  end if;
  if old.user_id <> new.user_id
     or old.offer_id <> new.offer_id
     or old.amount_minor <> new.amount_minor
     or old.currency <> new.currency
     or old.reference_code <> new.reference_code
     or old.created_at <> new.created_at
     or new.reviewed_by is not null
     or new.review_note is not null
     or new.approved_at is not null
     or new.rejected_at is not null
     or not (old.status = 'awaiting_payment' and new.status = 'submitted') then
    raise exception 'Customers may only submit their own awaiting payment order' using errcode = '42501';
  end if;
  new.submitted_at := coalesce(new.submitted_at, now());
  return new;
end;
$$;

create trigger payment_order_customer_guard
before update on public.payment_orders
for each row execute function private.protect_payment_order_update();

create or replace function private.assert_program_owned_and_active(p_program_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.programs p
    where p.id = p_program_id and p.user_id = p_user_id and p.status = 'active'
  );
$$;

revoke all on function private.assert_program_owned_and_active(uuid, uuid) from public;
grant execute on function private.assert_program_owned_and_active(uuid, uuid) to authenticated;

create or replace function public.approve_payment_order(
  p_order_id uuid,
  p_template_version_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.payment_orders%rowtype;
  v_version public.template_versions%rowtype;
  v_template public.program_templates%rowtype;
  v_program_id uuid := gen_random_uuid();
begin
  if not private.is_admin() then
    raise exception 'Admin authorization required' using errcode = '42501';
  end if;

  select * into v_order from public.payment_orders where id = p_order_id for update;
  if not found then raise exception 'Payment order not found'; end if;

  if v_order.status = 'approved' then
    select id into v_program_id from public.programs where approved_order_id = p_order_id;
    if v_program_id is not null then return v_program_id; end if;
    raise exception 'Approved order has no program snapshot';
  end if;
  if v_order.status not in ('awaiting_payment', 'submitted') then
    raise exception 'Only awaiting or submitted orders may be approved';
  end if;

  if p_template_version_id is null then
    select tv.* into v_version
    from public.offers o
    join public.template_versions tv on tv.template_id = o.template_id and tv.status = 'published'
    where o.id = v_order.offer_id;
  else
    select * into v_version from public.template_versions
    where id = p_template_version_id and status = 'published';
  end if;
  if v_version.id is null then raise exception 'Published template version not found'; end if;

  select * into v_template from public.program_templates where id = v_version.template_id;

  insert into public.programs (
    id, user_id, status, name_mm, name_en, source_template_id,
    source_template_version, approved_order_id, assigned_at, activated_at
  ) values (
    v_program_id, v_order.user_id, 'active',
    coalesce(v_version.name_mm, v_template.name_mm),
    coalesce(v_version.name_en, v_template.name_en),
    v_template.id, v_version.version_no, v_order.id, now(), now()
  );

  insert into public.program_documents (
    id, program_id, source_template_document_id, screen_key, day_number,
    title_mm, title_en, position
  )
  select gen_random_uuid(), v_program_id, d.id, d.screen_key, d.day_number,
         d.title_mm, d.title_en, d.position
  from public.template_documents d where d.template_version_id = v_version.id;

  insert into public.program_blocks (
    id, program_id, document_id, source_template_block_id, parent_id, position,
    block_type, title_mm, title_en, content_mm, content_en, config, asset_id, visible
  )
  select gen_random_uuid(), v_program_id, pd.id, b.id, null, b.position,
         b.block_type, b.title_mm, b.title_en, b.content_mm, b.content_en,
         b.config, b.asset_id, b.visible
  from public.template_blocks b
  join public.template_documents d on d.id = b.document_id
  join public.program_documents pd on pd.program_id = v_program_id and pd.source_template_document_id = d.id
  where d.template_version_id = v_version.id;

  update public.program_blocks child
  set parent_id = parent.id
  from public.template_blocks source_child
  join public.program_blocks parent
    on parent.program_id = v_program_id
   and parent.source_template_block_id = source_child.parent_id
  where child.program_id = v_program_id
    and child.source_template_block_id = source_child.id
    and source_child.parent_id is not null;

  insert into public.program_exercises (
    id, program_id, source_template_exercise_id, slug, name_mm, name_en,
    cue_mm, cue_en, video_asset_id, pattern, equipment_mm, equipment_en,
    kg_increment, is_big_four, unilateral, body_part, is_assessment_only, position
  )
  select gen_random_uuid(), v_program_id, e.id, e.slug, e.name_mm, e.name_en,
         e.cue_mm, e.cue_en, e.video_asset_id, e.pattern, e.equipment_mm, e.equipment_en,
         e.kg_increment, e.is_big_four, e.unilateral, e.body_part, e.is_assessment_only, e.position
  from public.template_exercises e where e.template_version_id = v_version.id;

  insert into public.program_days (
    id, program_id, source_template_day_id, day_number, day_type, phase, title_mm, title_en
  )
  select gen_random_uuid(), v_program_id, d.id, d.day_number, d.day_type,
         d.phase, d.title_mm, d.title_en
  from public.template_days d where d.template_version_id = v_version.id;

  insert into public.program_day_items (
    id, program_day_id, program_exercise_id, source_template_day_item_id,
    position, sets, reps_min, reps_max, target_kg, rest_seconds, effort
  )
  select gen_random_uuid(), pd.id, pe.id, i.id, i.position, i.sets,
         i.reps_min, i.reps_max, i.target_kg, i.rest_seconds, i.effort
  from public.template_day_items i
  join public.template_days td on td.id = i.template_day_id
  join public.program_days pd on pd.program_id = v_program_id and pd.source_template_day_id = td.id
  join public.program_exercises pe on pe.program_id = v_program_id and pe.source_template_exercise_id = i.template_exercise_id
  where td.template_version_id = v_version.id;

  insert into public.program_day_assets (
    id, program_day_id, source_template_day_asset_id, position, kind,
    asset_id, title_mm, title_en, duration_seconds
  )
  select gen_random_uuid(), pd.id, a.id, a.position, a.kind,
         a.asset_id, a.title_mm, a.title_en, a.duration_seconds
  from public.template_day_assets a
  join public.template_days td on td.id = a.template_day_id
  join public.program_days pd on pd.program_id = v_program_id and pd.source_template_day_id = td.id
  where td.template_version_id = v_version.id;

  insert into public.program_assessment_movements (
    id, program_id, source_template_movement_id, assessment_kind, position,
    name_mm, name_en, equipment_mm, equipment_en, rest_seconds
  )
  select gen_random_uuid(), v_program_id, m.id, m.assessment_kind, m.position,
         m.name_mm, m.name_en, m.equipment_mm, m.equipment_en, m.rest_seconds
  from public.template_assessment_movements m where m.template_version_id = v_version.id;

  insert into public.program_quiz_questions (
    id, program_id, source_template_question_id, position, question_mm,
    question_en, explanation_mm, explanation_en
  )
  select gen_random_uuid(), v_program_id, q.id, q.position, q.question_mm,
         q.question_en, q.explanation_mm, q.explanation_en
  from public.template_quiz_questions q where q.template_version_id = v_version.id;

  insert into public.program_quiz_options (
    id, question_id, source_template_option_id, position, text_mm, text_en
  )
  select gen_random_uuid(), pq.id, o.id, o.position, o.text_mm, o.text_en
  from public.template_quiz_options o
  join public.template_quiz_questions tq on tq.id = o.question_id
  join public.program_quiz_questions pq on pq.program_id = v_program_id and pq.source_template_question_id = tq.id
  where tq.template_version_id = v_version.id;

  insert into private.program_quiz_keys (question_id, correct_option_id)
  select pq.id, po.id
  from public.template_quiz_options source_option
  join public.template_quiz_questions source_question on source_question.id = source_option.question_id
  join public.program_quiz_questions pq on pq.program_id = v_program_id and pq.source_template_question_id = source_question.id
  join public.program_quiz_options po on po.question_id = pq.id and po.source_template_option_id = source_option.id
  where source_question.template_version_id = v_version.id and source_option.is_correct;

  update public.payment_orders
  set status = 'approved', approved_at = now(), reviewed_by = auth.uid(), updated_at = now()
  where id = v_order.id;

  insert into public.payment_reviews (order_id, reviewer_id, from_status, to_status, note)
  values (v_order.id, auth.uid(), v_order.status, 'approved', 'Program snapshot assigned');

  return v_program_id;
end;
$$;

revoke all on function public.approve_payment_order(uuid, uuid) from public;
grant execute on function public.approve_payment_order(uuid, uuid) to authenticated;

create or replace function public.complete_session(
  p_program_id uuid,
  p_day_number integer,
  p_local_date text,
  p_mutation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program public.programs%rowtype;
  v_session public.workout_sessions%rowtype;
  v_completed integer;
  v_day public.program_days%rowtype;
  v_item record;
  v_inserted uuid;
begin
  if p_local_date !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid local date'; end if;

  select * into v_program from public.programs where id = p_program_id for update;
  if not found or (v_program.user_id <> auth.uid() and not private.is_admin()) then
    raise exception 'Program not found' using errcode = '42501';
  end if;
  if v_program.status <> 'active' then raise exception 'Program is not active'; end if;

  select * into v_session
  from public.workout_sessions
  where program_id = p_program_id and day_number = p_day_number
  for update;

  if v_session.status = 'completed' then
    return jsonb_build_object('completed', true, 'day_number', p_day_number, 'idempotent', true);
  end if;

  select count(distinct day_number) into v_completed
  from public.workout_sessions where program_id = p_program_id and status = 'completed';
  if p_day_number <> v_completed + 1 then raise exception 'Unexpected session number'; end if;

  select * into v_day from public.program_days
  where program_id = p_program_id and day_number = p_day_number;
  if not found then raise exception 'Program day is not configured'; end if;
  if v_session.id is null then raise exception 'Workout session has not been started'; end if;
  if v_session.user_id <> v_program.user_id or v_session.session_type <> v_day.day_type then
    raise exception 'Workout session does not match assigned program day';
  end if;
  if exists (
    select 1 from public.workout_sessions s
    where s.program_id = p_program_id and s.local_date = p_local_date and s.status = 'completed'
  ) then raise exception 'A session is already completed for this local date'; end if;

  if exists (
    select 1
    from public.program_day_items i
    cross join lateral generate_series(1, i.sets) expected(set_index)
    where i.program_day_id = v_day.id
      and not exists (
        select 1 from public.set_logs l
        where l.session_id = v_session.id
          and l.program_day_item_id = i.id
          and l.set_index = expected.set_index
      )
  ) then raise exception 'Every prescribed set must be logged before completion'; end if;

  update public.workout_sessions
  set status = 'completed', local_date = p_local_date, completed_at = now(),
      mutation_id = coalesce(mutation_id, p_mutation_id), updated_at = now()
  where id = v_session.id;

  if v_day.phase = 2 and v_day.day_type <> 'challenge' then
    for v_item in
      select i.id, i.program_exercise_id, i.target_kg, e.kg_increment
      from public.program_day_items i
      join public.program_exercises e on e.id = i.program_exercise_id
      where i.program_day_id = v_day.id
        and e.kg_increment > 0
        and not exists (
          select 1 from public.set_logs l
          where l.session_id = v_session.id and l.program_day_item_id = i.id and l.reps < i.reps_max
        )
    loop
      v_inserted := null;
      insert into public.progression_events (
        program_id, session_id, program_exercise_id, old_target_kg, new_target_kg
      ) values (
        p_program_id, v_session.id, v_item.program_exercise_id,
        v_item.target_kg, v_item.target_kg + v_item.kg_increment
      )
      on conflict (session_id, program_exercise_id) do nothing
      returning id into v_inserted;

      if v_inserted is not null then
        update public.program_day_items future_item
        set target_kg = v_item.target_kg + v_item.kg_increment, updated_at = now()
        from public.program_days future_day
        where future_item.program_day_id = future_day.id
          and future_day.program_id = p_program_id
          and future_day.day_number > p_day_number
          and future_item.program_exercise_id = v_item.program_exercise_id;
      end if;
    end loop;
  end if;

  insert into public.sync_receipts (mutation_id, user_id, entity_type, entity_id)
  values (p_mutation_id, v_program.user_id, 'workout_session', v_session.id)
  on conflict (mutation_id) do nothing;

  if p_day_number = 48 then
    update public.programs set completed_at = coalesce(completed_at, now()), updated_at = now()
    where id = p_program_id;
  end if;

  return jsonb_build_object(
    'completed', true,
    'day_number', p_day_number,
    'completed_sessions', v_completed + 1,
    'phase_transition', p_day_number = 12,
    'program_complete', p_day_number = 48
  );
end;
$$;

revoke all on function public.complete_session(uuid, integer, text, uuid) from public;
grant execute on function public.complete_session(uuid, integer, text, uuid) to authenticated;

create or replace function public.answer_quiz_question(
  p_program_id uuid,
  p_question_id uuid,
  p_option_id uuid,
  p_local_date text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_id uuid;
  v_correct_option_id uuid;
  v_question public.program_quiz_questions%rowtype;
begin
  if not private.assert_program_owned_and_active(p_program_id) then
    raise exception 'Program not found' using errcode = '42501';
  end if;
  if p_local_date !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid local date'; end if;
  if (select count(*) from public.workout_sessions where program_id = p_program_id and status = 'completed') < 48 then
    raise exception 'The final quiz unlocks after session 48';
  end if;

  select * into v_question from public.program_quiz_questions
  where id = p_question_id and program_id = p_program_id;
  if not found then raise exception 'Quiz question not found'; end if;
  if not exists (select 1 from public.program_quiz_options where id = p_option_id and question_id = p_question_id) then
    raise exception 'Quiz option does not belong to this question';
  end if;

  insert into public.quiz_attempts (program_id, user_id, status, local_date)
  values (p_program_id, auth.uid(), 'in_progress', p_local_date)
  on conflict (program_id) do update set local_date = excluded.local_date, updated_at = now()
  returning id into v_attempt_id;

  insert into public.quiz_answers (attempt_id, question_id, option_id, user_id, local_date)
  values (v_attempt_id, p_question_id, p_option_id, auth.uid(), p_local_date)
  on conflict (attempt_id, question_id) do update
  set option_id = excluded.option_id, local_date = excluded.local_date, answered_at = now();

  select correct_option_id into v_correct_option_id
  from private.program_quiz_keys where question_id = p_question_id;

  return jsonb_build_object(
    'correct', p_option_id = v_correct_option_id,
    'correct_option_id', v_correct_option_id,
    'explanation_mm', v_question.explanation_mm,
    'explanation_en', v_question.explanation_en
  );
end;
$$;

revoke all on function public.answer_quiz_question(uuid, uuid, uuid, text) from public;
grant execute on function public.answer_quiz_question(uuid, uuid, uuid, text) to authenticated;

create or replace function public.complete_quiz(p_program_id uuid, p_local_date text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt_id uuid;
  v_expected integer;
  v_answered integer;
begin
  if not private.assert_program_owned_and_active(p_program_id) then
    raise exception 'Program not found' using errcode = '42501';
  end if;
  select id into v_attempt_id from public.quiz_attempts
  where program_id = p_program_id and user_id = auth.uid() for update;
  if v_attempt_id is null then raise exception 'Quiz has not been started'; end if;
  select count(*) into v_expected from public.program_quiz_questions where program_id = p_program_id;
  select count(*) into v_answered from public.quiz_answers where attempt_id = v_attempt_id;
  if v_expected = 0 or v_answered <> v_expected then raise exception 'Every quiz question must be answered'; end if;
  update public.quiz_attempts
  set status = 'completed', local_date = p_local_date, completed_at = now(), updated_at = now()
  where id = v_attempt_id;
  return jsonb_build_object('completed', true, 'answered', v_answered);
end;
$$;

revoke all on function public.complete_quiz(uuid, text) from public;
grant execute on function public.complete_quiz(uuid, text) to authenticated;

create view public.program_progress
with (security_invoker = true)
as
select
  p.id as program_id,
  p.user_id,
  count(distinct s.day_number) filter (where s.status = 'completed')::integer as completed_sessions,
  least(12, floor(count(distinct s.day_number) filter (where s.status = 'completed') / 4.0)::integer + 1) as week_number,
  case when count(distinct s.day_number) filter (where s.status = 'completed') < 12 then 1 else 2 end as phase,
  count(distinct s.day_number) filter (where s.status = 'completed') >= 48 as program_complete
from public.programs p
left join public.workout_sessions s on s.program_id = p.id
group by p.id, p.user_id;

-- Row-level authorization. Authorization is database-backed so revocation is immediate.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles','media_assets','site_pages','site_page_versions','site_blocks',
    'program_templates','template_versions','template_documents','template_blocks',
    'template_exercises','template_days','template_day_items','template_day_assets',
    'template_assessment_movements','template_quiz_questions','template_quiz_options',
    'offers','payment_instructions','payment_orders','payment_proofs','payment_reviews',
    'programs','program_documents','program_blocks','program_exercises','program_days',
    'program_day_items','program_day_assets','program_assessment_movements',
    'program_quiz_questions','program_quiz_options','workout_sessions','set_logs',
    'habit_logs','assessment_attempts','assessment_results','lesson_receipts',
    'milestone_receipts','quiz_attempts','quiz_answers','progression_events','sync_receipts'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

create policy profiles_read_self_or_admin on public.profiles
for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_update_self_or_admin on public.profiles
for update to authenticated
using (id = (select auth.uid()) or (select private.is_admin()))
with check (id = (select auth.uid()) or (select private.is_admin()));

create policy site_pages_public_read on public.site_pages
for select to anon, authenticated using (
  exists (select 1 from public.site_page_versions v where v.page_id = site_pages.id and v.status = 'published')
);
create policy site_versions_public_read on public.site_page_versions
for select to anon, authenticated using (status = 'published');
create policy site_blocks_public_read on public.site_blocks
for select to anon, authenticated using (
  exists (select 1 from public.site_page_versions v where v.id = site_page_version_id and v.status = 'published')
);

create policy media_public_or_admin_read on public.media_assets
for select to anon, authenticated
using (bucket_id = 'site-assets');

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'media_assets','site_pages','site_page_versions','site_blocks','program_templates',
    'template_versions','template_documents','template_blocks','template_exercises',
    'template_days','template_day_items','template_day_assets','template_assessment_movements',
    'template_quiz_questions','template_quiz_options','offers','payment_instructions','payment_reviews'
  ]
  loop
    execute format(
      'create policy %I_admin_all on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',
      table_name, table_name
    );
  end loop;
end;
$$;

create policy offers_public_read on public.offers
for select to anon, authenticated using (active);
create policy payment_instructions_public_read on public.payment_instructions
for select to anon, authenticated using (active);

create policy payment_orders_read on public.payment_orders
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy payment_orders_customer_insert on public.payment_orders
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'awaiting_payment'
  and reviewed_by is null and approved_at is null and rejected_at is null
  and exists (
    select 1 from public.offers o
    where o.id = offer_id and o.active and o.price_minor = amount_minor and o.currency = currency
  )
);
create policy payment_orders_update on public.payment_orders
for update to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()))
with check (user_id = (select auth.uid()) or (select private.is_admin()));
create policy payment_orders_admin_delete on public.payment_orders
for delete to authenticated using ((select private.is_admin()));

create policy payment_proofs_read on public.payment_proofs
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy payment_proofs_insert on public.payment_proofs
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.payment_orders o
    where o.id = order_id and o.user_id = (select auth.uid())
      and o.status in ('awaiting_payment','submitted')
  )
);
create policy payment_proofs_delete on public.payment_proofs
for delete to authenticated
using (
  (user_id = (select auth.uid()) and exists (
    select 1 from public.payment_orders o where o.id = order_id and o.status = 'awaiting_payment'
  )) or (select private.is_admin())
);
create policy payment_proofs_admin_update on public.payment_proofs
for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy programs_read on public.programs
for select to authenticated
using ((user_id = (select auth.uid()) and status in ('active','paused','completed')) or (select private.is_admin()));
create policy programs_admin_write on public.programs
for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'program_documents','program_blocks','program_exercises','program_days',
    'program_assessment_movements','program_quiz_questions'
  ]
  loop
    execute format(
      'create policy %I_customer_read on public.%I for select to authenticated using (exists (select 1 from public.programs p where p.id = program_id and p.user_id = (select auth.uid()) and p.status in (''active'',''paused'',''completed'')) or (select private.is_admin()))',
      table_name, table_name
    );
    execute format(
      'create policy %I_admin_write on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',
      table_name, table_name
    );
  end loop;
end;
$$;

create policy program_day_items_customer_read on public.program_day_items
for select to authenticated using (
  exists (
    select 1 from public.program_days d join public.programs p on p.id = d.program_id
    where d.id = program_day_id and p.user_id = (select auth.uid())
      and p.status in ('active','paused','completed')
  ) or (select private.is_admin())
);
create policy program_day_items_admin_write on public.program_day_items
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy program_day_assets_customer_read on public.program_day_assets
for select to authenticated using (
  exists (
    select 1 from public.program_days d join public.programs p on p.id = d.program_id
    where d.id = program_day_id and p.user_id = (select auth.uid())
      and p.status in ('active','paused','completed')
  ) or (select private.is_admin())
);
create policy program_day_assets_admin_write on public.program_day_assets
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy program_quiz_options_customer_read on public.program_quiz_options
for select to authenticated using (
  exists (
    select 1 from public.program_quiz_questions q join public.programs p on p.id = q.program_id
    where q.id = question_id and p.user_id = (select auth.uid())
      and p.status in ('active','paused','completed')
  ) or (select private.is_admin())
);
create policy program_quiz_options_admin_write on public.program_quiz_options
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy workout_sessions_read on public.workout_sessions
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy workout_sessions_insert on public.workout_sessions
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'in_progress'
  and private.assert_program_owned_and_active(program_id)
  and exists (
    select 1 from public.program_days d
    where d.program_id = workout_sessions.program_id
      and d.day_number = workout_sessions.day_number
      and d.day_type = workout_sessions.session_type
  )
);
create policy workout_sessions_update on public.workout_sessions
for update to authenticated
using ((user_id = (select auth.uid()) and status = 'in_progress') or (select private.is_admin()))
with check ((user_id = (select auth.uid()) and status = 'in_progress') or (select private.is_admin()));
create policy workout_sessions_admin_delete on public.workout_sessions
for delete to authenticated using ((select private.is_admin()));

create policy set_logs_read on public.set_logs
for select to authenticated
using (
  exists (select 1 from public.programs p where p.id = program_id and p.user_id = (select auth.uid()))
  or (select private.is_admin())
);
create policy set_logs_insert on public.set_logs
for insert to authenticated
with check (
  exists (
    select 1
    from public.workout_sessions s
    join public.programs p on p.id = s.program_id
    join public.program_days d on d.program_id = p.id and d.day_number = s.day_number
    join public.program_day_items i on i.program_day_id = d.id
    where s.id = session_id and i.id = program_day_item_id
      and p.id = set_logs.program_id and p.user_id = (select auth.uid())
      and p.status = 'active' and s.status = 'in_progress'
      and set_logs.set_index <= i.sets
  )
);
create policy set_logs_update on public.set_logs
for update to authenticated
using (
  exists (
    select 1 from public.workout_sessions s join public.programs p on p.id = s.program_id
    where s.id = session_id and p.user_id = (select auth.uid()) and s.status = 'in_progress'
  ) or (select private.is_admin())
)
with check (
  exists (
    select 1 from public.workout_sessions s join public.programs p on p.id = s.program_id
    where s.id = session_id and p.user_id = (select auth.uid()) and s.status = 'in_progress'
  ) or (select private.is_admin())
);
create policy set_logs_admin_delete on public.set_logs
for delete to authenticated using ((select private.is_admin()));

create policy habit_logs_read on public.habit_logs
for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy habit_logs_insert on public.habit_logs
for insert to authenticated
with check (user_id = (select auth.uid()) and private.assert_program_owned_and_active(program_id));
create policy habit_logs_update on public.habit_logs
for update to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()))
with check ((user_id = (select auth.uid()) and private.assert_program_owned_and_active(program_id)) or (select private.is_admin()));
create policy habit_logs_admin_delete on public.habit_logs
for delete to authenticated using ((select private.is_admin()));

create policy assessment_attempts_read on public.assessment_attempts
for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy assessment_attempts_insert on public.assessment_attempts
for insert to authenticated
with check (user_id = (select auth.uid()) and private.assert_program_owned_and_active(program_id));
create policy assessment_attempts_update on public.assessment_attempts
for update to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()))
with check ((user_id = (select auth.uid()) and private.assert_program_owned_and_active(program_id)) or (select private.is_admin()));
create policy assessment_attempts_admin_delete on public.assessment_attempts
for delete to authenticated using ((select private.is_admin()));

create policy assessment_results_read on public.assessment_results
for select to authenticated using (
  exists (select 1 from public.assessment_attempts a where a.id = attempt_id and a.user_id = (select auth.uid()))
  or (select private.is_admin())
);
create policy assessment_results_insert on public.assessment_results
for insert to authenticated with check (
  exists (
    select 1
    from public.assessment_attempts a
    join public.program_assessment_movements m on m.program_id = a.program_id and m.assessment_kind = a.kind
    where a.id = attempt_id and a.user_id = (select auth.uid()) and m.id = movement_id
      and private.assert_program_owned_and_active(a.program_id)
  )
);
create policy assessment_results_update on public.assessment_results
for update to authenticated
using (
  exists (select 1 from public.assessment_attempts a where a.id = attempt_id and a.user_id = (select auth.uid()))
  or (select private.is_admin())
)
with check (
  exists (select 1 from public.assessment_attempts a where a.id = attempt_id and a.user_id = (select auth.uid()))
  or (select private.is_admin())
);
create policy assessment_results_admin_delete on public.assessment_results
for delete to authenticated using ((select private.is_admin()));

do $$
declare
  table_name text;
begin
  foreach table_name in array array['lesson_receipts','milestone_receipts']
  loop
    execute format(
      'create policy %I_read on public.%I for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()))',
      table_name, table_name
    );
    execute format(
      'create policy %I_insert on public.%I for insert to authenticated with check (user_id = (select auth.uid()) and private.assert_program_owned_and_active(program_id))',
      table_name, table_name
    );
    execute format(
      'create policy %I_admin_write on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',
      table_name, table_name
    );
  end loop;
end;
$$;

create policy quiz_attempts_read on public.quiz_attempts
for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy quiz_attempts_admin_write on public.quiz_attempts
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy quiz_answers_read on public.quiz_answers
for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy quiz_answers_admin_write on public.quiz_answers
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy progression_events_read on public.progression_events
for select to authenticated using (
  exists (select 1 from public.programs p where p.id = program_id and p.user_id = (select auth.uid()))
  or (select private.is_admin())
);
create policy progression_events_admin_write on public.progression_events
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy sync_receipts_read on public.sync_receipts
for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy sync_receipts_insert on public.sync_receipts
for insert to authenticated with check (user_id = (select auth.uid()));
create policy sync_receipts_admin_write on public.sync_receipts
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

revoke all on all tables in schema public from anon, authenticated;
grant select on public.site_pages, public.site_page_versions, public.site_blocks,
  public.media_assets, public.offers, public.payment_instructions to anon;
grant select on public.admin_users, public.program_progress to authenticated;
grant select, update on public.profiles to authenticated;
grant all on all tables in schema public to authenticated;

create or replace function private.can_read_program_media(p_object_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.media_assets a
    where a.bucket_id = 'program-media' and a.object_path = p_object_path
      and (
        exists (
          select 1 from public.program_exercises e join public.programs p on p.id = e.program_id
          where e.video_asset_id = a.id and p.user_id = auth.uid() and p.status in ('active','paused','completed')
        )
        or exists (
          select 1
          from public.program_day_assets da
          join public.program_days d on d.id = da.program_day_id
          join public.programs p on p.id = d.program_id
          where da.asset_id = a.id and p.user_id = auth.uid() and p.status in ('active','paused','completed')
        )
        or exists (
          select 1 from public.program_blocks b join public.programs p on p.id = b.program_id
          where b.asset_id = a.id and p.user_id = auth.uid() and p.status in ('active','paused','completed')
        )
      )
  );
$$;

revoke all on function private.can_read_program_media(text) from public;
grant execute on function private.can_read_program_media(text) to authenticated;

create policy media_entitled_customer_read on public.media_assets
for select to authenticated using (
  bucket_id = 'program-media' and private.can_read_program_media(object_path)
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-assets', 'site-assets', true, 20971520, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('program-media', 'program-media', false, 104857600, array['video/mp4','video/webm','video/quicktime','application/pdf','image/jpeg','image/png','image/webp']),
  ('payment-proofs', 'payment-proofs', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy site_assets_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'site-assets' and (select private.is_admin()));
create policy site_assets_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'site-assets' and (select private.is_admin()))
with check (bucket_id = 'site-assets' and (select private.is_admin()));
create policy site_assets_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'site-assets' and (select private.is_admin()));

create policy program_media_entitled_read on storage.objects
for select to authenticated
using (
  bucket_id = 'program-media'
  and ((select private.is_admin()) or private.can_read_program_media(name))
);
create policy program_media_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'program-media' and (select private.is_admin()));
create policy program_media_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'program-media' and (select private.is_admin()))
with check (bucket_id = 'program-media' and (select private.is_admin()));
create policy program_media_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'program-media' and (select private.is_admin()));

create policy payment_proofs_object_read on storage.objects
for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_admin())
  )
);
create policy payment_proofs_object_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.payment_orders o
    where o.id::text = (storage.foldername(name))[2]
      and o.user_id = (select auth.uid())
      and o.status in ('awaiting_payment','submitted')
  )
);
create policy payment_proofs_object_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    ((storage.foldername(name))[1] = (select auth.uid())::text and exists (
      select 1 from public.payment_orders o
      where o.id::text = (storage.foldername(name))[2]
        and o.user_id = (select auth.uid()) and o.status = 'awaiting_payment'
    ))
    or (select private.is_admin())
  )
);

-- Published bilingual landing seed.
insert into public.site_pages (id, slug)
values ('10000000-0000-4000-8000-000000000004', 'home')
on conflict (id) do nothing;

insert into public.site_page_versions (id, page_id, version_no, status, published_at)
values ('10000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', 1, 'published', now())
on conflict (id) do nothing;

insert into public.site_blocks (
  id, site_page_version_id, position, block_type, content_mm, content_en, config
) values
(
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000005', 1, 'hero',
  jsonb_build_object('heading','စိတ်ကူးထဲက body ကို တကယ်နားလည် လိုက်လုပ်ဖြစ်အောင် စီစဉ်ထားတဲ့ 12 weeks plan နဲ့ စတင်လိုက်','subheading','Knowledge နဲ့ habit ကို တည်ဆောက်ပြီး ဘယ်အခြေအနေမှာမဆို ဆက်လုပ်နိုင်မယ့် fitness identity'),
  jsonb_build_object('heading','Start the 12-week plan designed to turn the body in your head into action you understand','subheading','Build the knowledge and habits that make fitness last in every season'),
  jsonb_build_object('theme','light','cta','purchase')
),
(
  '10000000-0000-4000-8000-000000000007',
  '10000000-0000-4000-8000-000000000005', 2, 'mission',
  jsonb_build_object('heading','Mission','body','Fitness ကို အစကနေအဆုံး လေ့လာဖို့မလိုဘဲ အပြောင်းအလဲဖြစ်စေမယ့် knowledge ကို လက်တွေ့လိုက်လုပ်ရလွယ်အောင် စီစဉ်ထားတယ်'),
  jsonb_build_object('heading','Mission','body','Make the knowledge that changes fitness clear, practical and inviting even for people who do not enjoy studying it'),
  '{}'::jsonb
),
(
  '10000000-0000-4000-8000-000000000008',
  '10000000-0000-4000-8000-000000000005', 3, 'vision',
  jsonb_build_object('heading','Vision','body','မြန်မာလူမျိုးတိုင်း ပိုကျစ်လစ် စိတ်ကောလူကောကျန်းမာပြီး ပိုကောင်းတဲ့လူ့ပတ်ဝန်းကျင်တစ်ခုဖြစ်အောင် ကြိုးစားမယ်'),
  jsonb_build_object('heading','Vision','body','Help people across Myanmar become stronger, healthier in body and mind, and build a better community'),
  '{}'::jsonb
)
on conflict (id) do nothing;

-- Default Project Peak template. It is assembled as a draft, then validated and published.
insert into public.program_templates (
  id, slug, name_mm, name_en, description_mm, description_en
) values (
  '10000000-0000-4000-8000-000000000001',
  'project-peak-home-workout-12-week',
  'Project Peak 12 ပတ် Home Workout',
  'Project Peak 12-Week Home Workout',
  'Backpack နဲ့ အိမ်မှာ 48 sessions လေ့ကျင့်မယ့် program',
  'A 48-session home program built around a backpack and simple equipment'
)
on conflict (id) do nothing;

insert into public.template_versions (
  id, template_id, version_no, status, name_mm, name_en
) values (
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  1, 'draft', 'Project Peak 12 ပတ် · v1', 'Project Peak 12 Week · v1'
)
on conflict (id) do nothing;

insert into public.template_documents (
  id, template_version_id, screen_key, title_mm, title_en, position
) values
('12000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','baseline_intro','ကြိုဆိုတယ်','Welcome',1),
('12000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','phase_2_transition','Phase 1 ပြီးပြီ','Phase 1 complete',1),
('12000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','program_complete','Congratulations','Congratulations',1)
on conflict (id) do nothing;

insert into public.template_blocks (
  id, document_id, position, block_type, content_mm, content_en, config
) values
('12100000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001',1,'rich_text',
 jsonb_build_object('text','Program ပြီးတဲ့အခါ တိုးတက်မှု ဘယ်လောက်ရှိလဲ ပြန်ယှဉ်ကြည့်ဖို့ ဒီ test ကို အရင်လုပ်မယ်'),
 jsonb_build_object('text','Start with this test so you can see exactly how far you progress by Week 12'), '{}'::jsonb),
('12100000-0000-4000-8000-000000000002','12000000-0000-4000-8000-000000000001',2,'timer',
 jsonb_build_object('label','လှုပ်ရှားမှုတစ်ခုပြီးတိုင်း နားချိန်'), jsonb_build_object('label','Rest after each movement'), jsonb_build_object('seconds',180)),
('12100000-0000-4000-8000-000000000003','12000000-0000-4000-8000-000000000002',1,'heading',
 jsonb_build_object('text','Congratulations'), jsonb_build_object('text','Congratulations'), '{}'::jsonb),
('12100000-0000-4000-8000-000000000004','12000000-0000-4000-8000-000000000002',2,'rich_text',
 jsonb_build_object('text','အခုကစပြီး progressive overload နဲ့ range ကို target ထားမယ်'),
 jsonb_build_object('text','From here, use progressive overload and make the rep range your target'), '{}'::jsonb),
('12100000-0000-4000-8000-000000000005','12000000-0000-4000-8000-000000000003',1,'heading',
 jsonb_build_object('text','Congratulations 💪'), jsonb_build_object('text','Congratulations 💪'), '{}'::jsonb),
('12100000-0000-4000-8000-000000000006','12000000-0000-4000-8000-000000000003',2,'rich_text',
 jsonb_build_object('text','အကြောင်းပြချက်မပေးဘဲ လွယ်အိတ်တစ်လုံးထဲနဲ့ ကြိုးစားတာ'),
 jsonb_build_object('text','You kept going with one backpack and no excuses'), '{}'::jsonb)
on conflict (id) do nothing;

insert into public.template_exercises (
  id, template_version_id, slug, name_mm, name_en, cue_mm, cue_en,
  pattern, equipment_mm, equipment_en, kg_increment, is_big_four,
  unilateral, body_part, is_assessment_only, position
) values
('11000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','dip','Dip','Dip','ပခုံးကို အောက်ချထား ရင်ကို အနည်းငယ်ရှေ့ကိုင်း form မပျက်ခင် ရပ်','Keep the shoulders down, lean slightly forward, and stop before form breaks','push','Dip station ဒါမှမဟုတ် ခိုင်တဲ့ထိုင်ခုံနှစ်လုံး','Dip station or two stable chairs',1,true,false,'upper',false,1),
('11000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','wide-push-up','Wide push up','Wide push up','ကိုယ်တစ်တန်းတည်းထားပြီး ရင်ဘတ်ကို ထိန်းချ','Keep a straight body line and lower with control','push','ကိုယ်အလေးချိန်','Bodyweight',1,true,false,'upper',false,2),
('11000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','bag-tricep-extension','Bag tricep extension','Bag tricep extension','တံတောင်ဆစ်ကို မရွှေ့ဘဲ အပြည့်ဆန့်','Keep the elbows still and extend fully','push','Backpack','Backpack',1,false,false,'upper',false,3),
('11000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','lateral-raise','Lateral raise','Lateral raise','ပခုံးနဲ့တန်းတဲ့အထိ ထိန်းပြီး မြှောက်','Raise with control to shoulder height','raise','ရေဘူး သို့မဟုတ် Backpack','Water bottles or backpack',1,false,false,'upper',false,4),
('11000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000002','sissy-squat','Sissy squat','Sissy squat','ဒူးနဲ့တင်ပါးကို ထိန်းပြီး ဖြည်းဖြည်းဆင်း','Keep the knees and hips controlled as you lower','squat','ကိုယ်အလေးချိန်','Bodyweight',1,true,false,'lower',false,5),
('11000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000002','single-leg-calf-raise','တစ်ဖက်စီ Calf raise','Single-leg calf raise','အပေါ်မှာ ခဏရပ်ပြီး အောက်ကို အပြည့်ဆင်း','Pause at the top and lower through the full range','calf','Backpack','Backpack',1,false,true,'lower',false,6),
('11000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000002','wide-pull-up','Wide pull up','Wide pull up','ရင်ဘတ်ကို ဘားဆီဆွဲပြီး ဖြည်းဖြည်းပြန်ဆင်း','Pull the chest toward the bar and lower under control','pull','Doorway pull-up bar','Doorway pull-up bar',1,true,false,'upper',false,7),
('11000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000002','single-arm-upper-back-fly','တစ်ဖက်စီ Upper back fly','Single-arm upper back fly','လက်မောင်းမဆွဲဘဲ နောက်ကျောကို ညှစ်','Drive from the upper back instead of pulling with the arm','pull','Backpack','Backpack',1,false,true,'upper',false,8),
('11000000-0000-4000-8000-000000000009','10000000-0000-4000-8000-000000000002','single-arm-preacher-curl','တစ်ဖက်စီ Preacher curl','Single-arm preacher curl','လက်မောင်းအပေါ်ပိုင်းကို တည်ငြိမ်ထား','Keep the upper arm fixed throughout the curl','curl','Backpack','Backpack',1,false,true,'upper',false,9),
('11000000-0000-4000-8000-000000000010','10000000-0000-4000-8000-000000000002','hammer-curl','Hammer curl','Hammer curl','လက်ကောက်ဝတ်တည့်တည့်ထားပြီး ထိန်းဆွဲ','Keep neutral wrists and curl with control','curl','Backpack','Backpack',1,false,false,'upper',false,10),
('11000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000002','hamstring-curl','Hamstring curl','Hamstring curl','တင်ပါးမလှုပ်ဘဲ ခြေဖနောင့်ကို ဆွဲတင်','Keep the hips still and curl the heels in','hinge','Backpack','Backpack',1,false,false,'lower',false,11),
('11000000-0000-4000-8000-000000000012','10000000-0000-4000-8000-000000000002','abs-crunch','Abs crunch','Abs crunch','ခါးကိုမဆွဲဘဲ ဝမ်းဗိုက်ကို ညှစ်','Curl through the abs without pulling the neck','core','ကိုယ်အလေးချိန်','Bodyweight',1,false,false,'core',false,12),
('11000000-0000-4000-8000-000000000013','10000000-0000-4000-8000-000000000002','push-up-test','Push up','Push up','Form မပျက်ဘဲ အများဆုံးလုပ်','Perform maximum clean reps without losing form','push','ကိုယ်အလေးချိန်','Bodyweight',0,false,false,'upper',true,13)
on conflict (id) do nothing;

insert into public.template_days (
  id, template_version_id, day_number, day_type, phase, title_mm, title_en
)
select
  md5('project-peak-template-day-' || n)::uuid,
  '10000000-0000-4000-8000-000000000002',
  n,
  case when n = 48 then 'challenge'::public.day_type when n % 2 = 1 then 'push'::public.day_type else 'pull'::public.day_type end,
  case when n <= 12 then 1 else 2 end,
  case when n = 48 then 'နောက်ဆုံးနေ့ challenge' when n % 2 = 1 then 'Push day' else 'Pull day' end,
  case when n = 48 then 'Final challenge' when n % 2 = 1 then 'Push day' else 'Pull day' end
from generate_series(1,48) n
on conflict (template_version_id, day_number) do nothing;

with specs(day_type, slug, position) as (
  values
    ('push'::public.day_type,'dip',1), ('push'::public.day_type,'wide-push-up',2),
    ('push'::public.day_type,'bag-tricep-extension',3), ('push'::public.day_type,'lateral-raise',4),
    ('push'::public.day_type,'sissy-squat',5), ('push'::public.day_type,'single-leg-calf-raise',6),
    ('pull'::public.day_type,'wide-pull-up',1), ('pull'::public.day_type,'single-arm-upper-back-fly',2),
    ('pull'::public.day_type,'single-arm-preacher-curl',3), ('pull'::public.day_type,'hammer-curl',4),
    ('pull'::public.day_type,'hamstring-curl',5), ('pull'::public.day_type,'abs-crunch',6)
)
insert into public.template_day_items (
  id, template_day_id, template_exercise_id, position, sets,
  reps_min, reps_max, target_kg, rest_seconds, effort
)
select
  md5('project-peak-template-item-' || d.day_number || '-' || s.slug)::uuid,
  d.id, e.id, s.position,
  case when d.phase = 1 and s.slug in ('dip','wide-pull-up') then 4 else 3 end,
  case
    when d.phase = 1 and s.slug in ('dip','wide-push-up') then 4
    when d.phase = 1 and s.slug = 'wide-pull-up' then 1
    when d.phase = 1 and s.slug = 'sissy-squat' then 2
    when d.phase = 1 then 9
    when e.is_big_four then 7
    when e.body_part = 'lower' then 10
    else 8
  end,
  case
    when d.phase = 1 and s.slug in ('dip','wide-push-up') then 9
    when d.phase = 1 and s.slug = 'wide-pull-up' then 7
    when d.phase = 1 and s.slug = 'sissy-squat' then 7
    when d.phase = 1 then 9
    when e.is_big_four then 10
    when e.body_part = 'lower' then 15
    else 12
  end,
  0,
  case when e.is_big_four and d.phase = 2 then 150 when e.is_big_four then 90 else 30 end,
  case when d.phase = 1 then 'technique' when e.is_big_four then 'near_failure' else 'range_target' end
from public.template_days d
join specs s on s.day_type = d.day_type
join public.template_exercises e on e.template_version_id = d.template_version_id and e.slug = s.slug
where d.template_version_id = '10000000-0000-4000-8000-000000000002' and d.day_number < 48
on conflict (template_day_id, position) do nothing;

with challenge(slug, position) as (
  values ('push-up-test',1),('wide-pull-up',2),('lateral-raise',3),('sissy-squat',4)
)
insert into public.template_day_items (
  id, template_day_id, template_exercise_id, position, sets,
  reps_min, reps_max, target_kg, rest_seconds, effort
)
select md5('project-peak-template-item-48-' || c.slug)::uuid,
       d.id, e.id, c.position, 1, 0, 999, 0, 180, 'max_clean_reps'
from challenge c
join public.template_exercises e on e.template_version_id = '10000000-0000-4000-8000-000000000002' and e.slug = c.slug
join public.template_days d on d.template_version_id = e.template_version_id and d.day_number = 48
on conflict (template_day_id, position) do nothing;

insert into public.template_assessment_movements (
  id, template_version_id, assessment_kind, position, name_mm, name_en,
  equipment_mm, equipment_en, rest_seconds
)
select
  md5('project-peak-assessment-' || k.kind || '-' || k.position)::uuid,
  '10000000-0000-4000-8000-000000000002', k.kind::public.assessment_kind,
  k.position, k.name_mm, k.name_en, k.equipment_mm, k.equipment_en, 180
from (values
  ('baseline',1,'Push up','Push up','ကိုယ်အလေးချိန်','Bodyweight'),
  ('baseline',2,'Wide pull up','Wide pull up','Pull-up bar','Pull-up bar'),
  ('baseline',3,'Lateral raise','Lateral raise','ရေ 4 L','4 L water'),
  ('baseline',4,'Sissy squat','Sissy squat','ကိုယ်အလေးချိန်','Bodyweight'),
  ('final',1,'Push up','Push up','ကိုယ်အလေးချိန်','Bodyweight'),
  ('final',2,'Wide pull up','Wide pull up','Pull-up bar','Pull-up bar'),
  ('final',3,'Lateral raise','Lateral raise','ရေ 4 L','4 L water'),
  ('final',4,'Sissy squat','Sissy squat','ကိုယ်အလေးချိန်','Bodyweight')
) as k(kind,position,name_mm,name_en,equipment_mm,equipment_en)
on conflict (template_version_id, assessment_kind, position) do nothing;

insert into public.template_quiz_questions (
  id, template_version_id, position, question_mm, question_en, explanation_mm, explanation_en
) values
('13000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',1,'Progressive overload ဆိုတာ ဘာလဲ','What is progressive overload?','အချိန်နဲ့အမျှ reps ဒါမှမဟုတ် load ကို စနစ်တကျတိုးတာ','It means systematically increasing reps or load over time'),
('13000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002',2,'Rep range ရဲ့ အပေါ်ဆုံးကို set အားလုံးရရင် ဘာလုပ်မလဲ','What do you do after every set reaches the top of its rep range?','နောက် session မှာ load တိုးပြီး range အောက်ဆုံးက ပြန်စ','Increase the load next session and restart at the bottom of the range'),
('13000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002',3,'Form ပျက်လာရင် ဘာကို ဦးစားပေးမလဲ','What takes priority when form begins to break?','Rep မတိုးဘဲ clean form နဲ့ ရပ်တာက ဦးစားပေး','Stop with clean form instead of forcing another rep'),
('13000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002',4,'Rest day က failure ဖြစ်လား','Is a rest day a failure?','မဟုတ်ဘူး Recovery က program ရဲ့အစိတ်အပိုင်း','No. Recovery is part of the program'),
('13000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000002',5,'Protein နဲ့ water habit ကို ဘာကြောင့် ရိုးရိုး checkbox သုံးလဲ','Why are protein and water tracked as simple checkboxes?','လုပ်ရလွယ်ပြီး အလေ့အကျင့် ဆက်တည်နိုင်ဖို့','To keep the habit practical and sustainable')
on conflict (id) do nothing;

insert into public.template_quiz_options (
  id, question_id, position, text_mm, text_en, is_correct
)
select md5('project-peak-q' || v.q || '-o' || v.pos)::uuid,
       ('13000000-0000-4000-8000-' || lpad(v.q::text,12,'0'))::uuid,
       v.pos, v.mm, v.en, v.correct
from (values
  (1,1,'Session တိုင်း load တိုးတာ','Add load every session',false),
  (1,2,'Reps ဒါမှမဟုတ် load ကို ဖြည်းဖြည်းတိုးတာ','Gradually increase reps or load',true),
  (1,3,'နေ့တိုင်းလေ့ကျင့်တာ','Train every day',false),
  (1,4,'အမြဲ failure ထိလုပ်တာ','Always train to failure',false),
  (2,1,'Load တိုးပြီး range အောက်ဆုံးက ပြန်စ','Add load and restart at the bottom',true),
  (2,2,'အနားယူချိန်ဖြုတ်','Remove rest time',false),
  (2,3,'Set နှစ်ဆလုပ်','Double the sets',false),
  (2,4,'ဘာမှမပြောင်း','Change nothing',false),
  (3,1,'Rep ကို အတင်းဆက်','Force another rep',false),
  (3,2,'Clean form နဲ့ရပ်','Stop with clean form',true),
  (3,3,'ပိုမြန်လုပ်','Move faster',false),
  (3,4,'နားချိန်မယူ','Skip rest',false),
  (4,1,'ဟုတ်တယ်','Yes',false),
  (4,2,'မဟုတ်ဘူး Recovery ပါ','No, it is recovery',true),
  (4,3,'Phase 1 မှာပဲ','Only in Phase 1',false),
  (4,4,'Week 12 မှာပဲ','Only in Week 12',false),
  (5,1,'အလေ့အကျင့်လုပ်ရလွယ်ဖို့','To make the habit easy to sustain',true),
  (5,2,'Data မလိုလို့','Because data is unnecessary',false),
  (5,3,'အစားအစာမသက်ဆိုင်လို့','Because food does not matter',false),
  (5,4,'အိပ်ချိန်နဲ့တူလို့','Because it is the same as sleep',false)
) as v(q,pos,mm,en,correct)
on conflict (id) do nothing;

update public.template_versions
set status = 'published', published_at = now()
where id = '10000000-0000-4000-8000-000000000002' and status = 'draft';

insert into public.offers (
  id, template_id, slug, name_mm, name_en, price_minor, currency, active
) values (
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000001',
  'project-peak-12-week-home-workout',
  '12 ပတ် Home Workout', '12-Week Home Workout', 75000, 'MMK', true
)
on conflict (id) do update set price_minor = excluded.price_minor, active = true;

insert into public.payment_instructions (
  id, offer_id, method, recipient_handle, instructions_mm, instructions_en, active
) values (
  '10000000-0000-4000-8000-000000000009',
  '10000000-0000-4000-8000-000000000003',
  'kpay', '@wayneax21',
  'KPay ငွေလွှဲပြီး payment screenshot ကို @wayneax21 ဆီ ပို့ပေး',
  'Pay with KPay, then send the payment screenshot to @wayneax21', true
)
on conflict (id) do update set recipient_handle = excluded.recipient_handle, active = true;
