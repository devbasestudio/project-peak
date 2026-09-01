-- A movement may have a main demonstration and one or more accessible alternatives.
-- Template rows remain editable only while their owning version is a draft. Program
-- rows are immutable snapshots copied at purchase approval time.
create table public.template_exercise_videos (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null references public.template_exercises(id) on delete cascade,
  position smallint not null check (position between 1 and 4),
  role text not null check (role in ('primary', 'alternative')),
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  title_mm text not null,
  title_en text not null,
  cue_mm text,
  cue_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_exercise_id, position),
  unique (template_exercise_id, role)
);

create table public.program_exercise_videos (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  program_exercise_id uuid not null references public.program_exercises(id) on delete cascade,
  source_template_exercise_video_id uuid,
  position smallint not null check (position between 1 and 4),
  role text not null check (role in ('primary', 'alternative')),
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  title_mm text not null,
  title_en text not null,
  cue_mm text,
  cue_en text,
  created_at timestamptz not null default now(),
  unique (program_exercise_id, position),
  unique (program_exercise_id, role)
);

create index template_exercise_videos_order_idx
on public.template_exercise_videos(template_exercise_id, position);

create index program_exercise_videos_order_idx
on public.program_exercise_videos(program_exercise_id, position);

create or replace function private.assert_template_exercise_video_draft()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_exercise_id uuid;
begin
  v_exercise_id := case when tg_op = 'DELETE' then old.template_exercise_id else new.template_exercise_id end;
  if not exists (
    select 1
    from public.template_exercises e
    join public.template_versions v on v.id = e.template_version_id
    where e.id = v_exercise_id and v.status = 'draft'
  ) then
    raise exception 'Only videos in draft template versions may be edited' using errcode = '55000';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger template_exercise_videos_draft_only
before insert or update or delete on public.template_exercise_videos
for each row execute function private.assert_template_exercise_video_draft();

-- Keep snapshot creation centralized: every copied exercise receives the exact
-- video alternatives that belonged to the approved template version.
create or replace function private.copy_template_exercise_videos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source_template_exercise_id is not null then
    insert into public.program_exercise_videos (
      id, program_id, program_exercise_id, source_template_exercise_video_id,
      position, role, asset_id, title_mm, title_en, cue_mm, cue_en
    )
    select gen_random_uuid(), new.program_id, new.id, v.id,
           v.position, v.role, v.asset_id, v.title_mm, v.title_en, v.cue_mm, v.cue_en
    from public.template_exercise_videos v
    where v.template_exercise_id = new.source_template_exercise_id
    order by v.position;
  end if;
  return new;
end;
$$;

create trigger program_exercise_copy_videos
after insert on public.program_exercises
for each row execute function private.copy_template_exercise_videos();

alter table public.template_exercise_videos enable row level security;
alter table public.program_exercise_videos enable row level security;

create policy template_exercise_videos_admin_all on public.template_exercise_videos
for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy program_exercise_videos_customer_read on public.program_exercise_videos
for select to authenticated using (
  exists (
    select 1 from public.programs p
    where p.id = program_id
      and p.user_id = (select auth.uid())
      and p.status in ('active', 'paused', 'completed')
  ) or (select private.is_admin())
);

create policy program_exercise_videos_admin_write on public.program_exercise_videos
for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

revoke all on public.template_exercise_videos, public.program_exercise_videos from anon, authenticated;
grant all on public.template_exercise_videos, public.program_exercise_videos to authenticated;

-- Published versions are immutable by design. Clone v1 into a fresh draft, edit
-- that draft below, then atomically archive v1 and publish v2.
insert into public.template_versions (
  id, template_id, version_no, status, name_mm, name_en, checksum_sha256, created_by
)
select
  '10000000-0000-4000-8000-000000000004',
  template_id,
  2,
  'draft',
  'Project Peak 12 ပတ် · PDF Plan v2',
  'Project Peak 12 Week · PDF Plan v2',
  null,
  created_by
from public.template_versions
where id = '10000000-0000-4000-8000-000000000002';

insert into public.template_documents (
  id, template_version_id, screen_key, day_number, title_mm, title_en, position
)
select
  md5('project-peak-v2-document-' || id)::uuid,
  '10000000-0000-4000-8000-000000000004',
  screen_key,
  day_number,
  title_mm,
  title_en,
  position
from public.template_documents
where template_version_id = '10000000-0000-4000-8000-000000000002';

insert into public.template_blocks (
  id, document_id, parent_id, position, block_type, title_mm, title_en,
  content_mm, content_en, config, asset_id, visible
)
select
  md5('project-peak-v2-block-' || b.id)::uuid,
  md5('project-peak-v2-document-' || b.document_id)::uuid,
  case when b.parent_id is null then null else md5('project-peak-v2-block-' || b.parent_id)::uuid end,
  b.position,
  b.block_type,
  b.title_mm,
  b.title_en,
  b.content_mm,
  b.content_en,
  b.config,
  b.asset_id,
  b.visible
from public.template_blocks b
join public.template_documents d on d.id = b.document_id
where d.template_version_id = '10000000-0000-4000-8000-000000000002';

insert into public.template_exercises (
  id, template_version_id, slug, name_mm, name_en, cue_mm, cue_en,
  video_asset_id, pattern, equipment_mm, equipment_en, kg_increment,
  is_big_four, unilateral, body_part, is_assessment_only, position
)
select
  md5('project-peak-v2-exercise-' || id)::uuid,
  '10000000-0000-4000-8000-000000000004',
  slug,
  name_mm,
  name_en,
  cue_mm,
  cue_en,
  video_asset_id,
  pattern,
  equipment_mm,
  equipment_en,
  kg_increment,
  is_big_four,
  unilateral,
  body_part,
  is_assessment_only,
  position
from public.template_exercises
where template_version_id = '10000000-0000-4000-8000-000000000002';

insert into public.template_days (
  id, template_version_id, day_number, day_type, phase, title_mm, title_en
)
select
  md5('project-peak-v2-day-' || id)::uuid,
  '10000000-0000-4000-8000-000000000004',
  day_number,
  day_type,
  phase,
  title_mm,
  title_en
from public.template_days
where template_version_id = '10000000-0000-4000-8000-000000000002';

insert into public.template_day_assets (
  id, template_day_id, position, kind, asset_id, title_mm, title_en, duration_seconds
)
select
  md5('project-peak-v2-day-asset-' || a.id)::uuid,
  md5('project-peak-v2-day-' || a.template_day_id)::uuid,
  a.position,
  a.kind,
  a.asset_id,
  a.title_mm,
  a.title_en,
  a.duration_seconds
from public.template_day_assets a
join public.template_days d on d.id = a.template_day_id
where d.template_version_id = '10000000-0000-4000-8000-000000000002';

insert into public.template_assessment_movements (
  id, template_version_id, assessment_kind, position, name_mm, name_en,
  equipment_mm, equipment_en, rest_seconds
)
select
  md5('project-peak-v2-assessment-' || id)::uuid,
  '10000000-0000-4000-8000-000000000004',
  assessment_kind,
  position,
  name_mm,
  name_en,
  equipment_mm,
  equipment_en,
  rest_seconds
from public.template_assessment_movements
where template_version_id = '10000000-0000-4000-8000-000000000002';

insert into public.template_quiz_questions (
  id, template_version_id, position, question_mm, question_en, explanation_mm, explanation_en
)
select
  md5('project-peak-v2-question-' || id)::uuid,
  '10000000-0000-4000-8000-000000000004',
  position,
  question_mm,
  question_en,
  explanation_mm,
  explanation_en
from public.template_quiz_questions
where template_version_id = '10000000-0000-4000-8000-000000000002';

insert into public.template_quiz_options (
  id, question_id, position, text_mm, text_en, is_correct
)
select
  md5('project-peak-v2-option-' || o.id)::uuid,
  md5('project-peak-v2-question-' || o.question_id)::uuid,
  o.position,
  o.text_mm,
  o.text_en,
  o.is_correct
from public.template_quiz_options o
join public.template_quiz_questions q on q.id = o.question_id
where q.template_version_id = '10000000-0000-4000-8000-000000000002';

-- Sample media supplied by the client. These object paths are private; the app
-- creates short-lived signed playback URLs after program entitlement is checked.
insert into public.media_assets (
  id, bucket_id, object_path, kind, mime_type, byte_size, alt_mm, alt_en, uploaded_by
) values
  ('7a100000-0000-4000-8000-000000000001', 'program-media', 'exercise-samples/primary-77916.mp4', 'video', 'video/mp4', 9954722, 'အဓိက လေ့ကျင့်ခန်း နမူနာ', 'Primary exercise demonstration', null),
  ('7a100000-0000-4000-8000-000000000002', 'program-media', 'exercise-samples/alternative-200657.mp4', 'video', 'video/mp4', 7222656, 'အစားထိုး လေ့ကျင့်ခန်း နမူနာ', 'Alternative exercise demonstration', null)
on conflict (id) do update set
  bucket_id = excluded.bucket_id,
  object_path = excluded.object_path,
  kind = excluded.kind,
  mime_type = excluded.mime_type,
  byte_size = excluded.byte_size,
  alt_mm = excluded.alt_mm,
  alt_en = excluded.alt_en;

-- The PDF specifies 48 alternating sessions. Session 48 is Pull, not a separate
-- challenge day. Phase 1 covers Sessions 1-12; Phase 2 covers Sessions 13-48.
update public.template_days
set day_type = case when day_number % 2 = 1 then 'push'::public.day_type else 'pull'::public.day_type end,
    phase = case when day_number <= 12 then 1 else 2 end,
    title_mm = case when day_number % 2 = 1 then 'Push လေ့ကျင့်ခန်း' else 'Pull လေ့ကျင့်ခန်း' end,
    title_en = case when day_number % 2 = 1 then 'Push session' else 'Pull session' end,
    updated_at = now()
where template_version_id = '10000000-0000-4000-8000-000000000004';

update public.template_exercises
set unilateral = true, updated_at = now()
where template_version_id = '10000000-0000-4000-8000-000000000004'
  and slug in ('bag-tricep-extension', 'lateral-raise', 'single-arm-upper-back-fly', 'single-arm-preacher-curl', 'hammer-curl', 'hamstring-curl', 'single-leg-calf-raise');

delete from public.template_day_items
where template_day_id in (
  select id from public.template_days
  where template_version_id = '10000000-0000-4000-8000-000000000004'
);

with specs(day_type, slug, position) as (
  values
    ('push'::public.day_type,'dip',1),
    ('push'::public.day_type,'wide-push-up',2),
    ('push'::public.day_type,'bag-tricep-extension',3),
    ('push'::public.day_type,'lateral-raise',4),
    ('push'::public.day_type,'sissy-squat',5),
    ('push'::public.day_type,'single-leg-calf-raise',6),
    ('pull'::public.day_type,'wide-pull-up',1),
    ('pull'::public.day_type,'single-arm-upper-back-fly',2),
    ('pull'::public.day_type,'single-arm-preacher-curl',3),
    ('pull'::public.day_type,'hammer-curl',4),
    ('pull'::public.day_type,'hamstring-curl',5),
    ('pull'::public.day_type,'abs-crunch',6)
)
insert into public.template_day_items (
  id, template_day_id, template_exercise_id, position, sets,
  reps_min, reps_max, target_kg, rest_seconds, effort
)
select
  md5('project-peak-template-item-v2-' || d.day_number || '-' || s.slug)::uuid,
  d.id,
  e.id,
  s.position,
  case when d.phase = 1 and s.slug in ('dip', 'wide-pull-up') then 4 else 3 end,
  case
    when d.phase = 1 and s.slug in ('dip', 'wide-push-up') then 4
    when d.phase = 1 and s.slug = 'wide-pull-up' then 1
    when d.phase = 1 and s.slug = 'sissy-squat' then 2
    when d.phase = 1 then 9
    when s.slug in ('dip', 'wide-push-up', 'wide-pull-up', 'sissy-squat') then 7
    when s.slug in ('single-leg-calf-raise', 'hamstring-curl') then 10
    else 8
  end,
  case
    when d.phase = 1 and s.slug in ('dip', 'wide-push-up') then 9
    when d.phase = 1 and s.slug = 'wide-pull-up' then 7
    when d.phase = 1 and s.slug = 'sissy-squat' then 7
    when d.phase = 1 then 9
    when s.slug in ('dip', 'wide-push-up', 'wide-pull-up', 'sissy-squat') then 10
    when s.slug in ('single-leg-calf-raise', 'hamstring-curl') then 15
    else 12
  end,
  0,
  case
    when d.phase = 2 and s.slug in ('dip', 'wide-push-up', 'wide-pull-up', 'sissy-squat') then 150
    when d.phase = 1 and s.slug in ('dip', 'wide-push-up', 'wide-pull-up', 'sissy-squat') then 90
    else 30
  end,
  case when d.phase = 1 then 'technique' else 'progressive_overload' end
from public.template_days d
join specs s on s.day_type = d.day_type
join public.template_exercises e
  on e.template_version_id = d.template_version_id and e.slug = s.slug
where d.template_version_id = '10000000-0000-4000-8000-000000000004'
on conflict (template_day_id, position) do update set
  template_exercise_id = excluded.template_exercise_id,
  sets = excluded.sets,
  reps_min = excluded.reps_min,
  reps_max = excluded.reps_max,
  target_kg = excluded.target_kg,
  rest_seconds = excluded.rest_seconds,
  effort = excluded.effort,
  updated_at = now();

insert into public.template_exercise_videos (
  id, template_exercise_id, position, role, asset_id,
  title_mm, title_en, cue_mm, cue_en
)
select
  md5('project-peak-video-primary-' || e.id)::uuid,
  e.id,
  1,
  'primary',
  '7a100000-0000-4000-8000-000000000001',
  'အဓိကနည်း',
  'Main movement',
  'အရင်ဆုံး ဒီနည်းကို လုပ်ကြည့်ပါ။ Form ပျက်လာရင် အစားထိုးနည်းကို ရွေးပါ။',
  'Start here. Switch to the alternative if you cannot keep clean form.'
from public.template_exercises e
where e.template_version_id = '10000000-0000-4000-8000-000000000004'
  and not e.is_assessment_only
on conflict (template_exercise_id, role) do update set
  asset_id = excluded.asset_id,
  title_mm = excluded.title_mm,
  title_en = excluded.title_en,
  cue_mm = excluded.cue_mm,
  cue_en = excluded.cue_en,
  updated_at = now();

insert into public.template_exercise_videos (
  id, template_exercise_id, position, role, asset_id,
  title_mm, title_en, cue_mm, cue_en
)
select
  md5('project-peak-video-alternative-' || e.id)::uuid,
  e.id,
  2,
  'alternative',
  '7a100000-0000-4000-8000-000000000002',
  'အစားထိုးနည်း',
  'Alternative movement',
  'အဓိကနည်း အဆင်မပြေရင် ဒီနည်းကို ရွေးပြီး သတ်မှတ်ထားတဲ့ Sets နဲ့ Reps အတိုင်းလုပ်ပါ။',
  'Use this option when the main movement is not comfortable. Keep the same sets and reps.'
from public.template_exercises e
where e.template_version_id = '10000000-0000-4000-8000-000000000004'
  and not e.is_assessment_only
on conflict (template_exercise_id, role) do update set
  asset_id = excluded.asset_id,
  title_mm = excluded.title_mm,
  title_en = excluded.title_en,
  cue_mm = excluded.cue_mm,
  cue_en = excluded.cue_en,
  updated_at = now();

-- Existing customer copies keep their workout history and receive the same
-- temporary demonstrations without being rebuilt from the master template.
insert into public.program_exercise_videos (
  id, program_id, program_exercise_id, position, role, asset_id,
  title_mm, title_en, cue_mm, cue_en
)
select
  md5('project-peak-program-video-primary-' || e.id)::uuid,
  e.program_id,
  e.id,
  1,
  'primary',
  '7a100000-0000-4000-8000-000000000001',
  'အဓိကနည်း',
  'Main movement',
  'Form ကိုအရင်ကြည့်ပြီးမှ Set စလုပ်ပါ။ အဆင်မပြေရင် အစားထိုးနည်းကို ရွေးနိုင်ပါတယ်။',
  'Review the form before your first set. Use the alternative when needed.'
from public.program_exercises e
where not e.is_assessment_only
on conflict (program_exercise_id, role) do nothing;

insert into public.program_exercise_videos (
  id, program_id, program_exercise_id, position, role, asset_id,
  title_mm, title_en, cue_mm, cue_en
)
select
  md5('project-peak-program-video-alternative-' || e.id)::uuid,
  e.program_id,
  e.id,
  2,
  'alternative',
  '7a100000-0000-4000-8000-000000000002',
  'အစားထိုးနည်း',
  'Alternative movement',
  'အဓိကနည်း အဆင်မပြေရင် ဒီနည်းကို ရွေးပြီး Sets နဲ့ Reps တူတူလုပ်ပါ။',
  'Use this option when the main movement is not comfortable. Keep the same sets and reps.'
from public.program_exercises e
where not e.is_assessment_only
on conflict (program_exercise_id, role) do nothing;

-- Include alternative assets in the private-media entitlement check.
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
          select 1 from public.program_exercises e
          join public.programs p on p.id = e.program_id
          where e.video_asset_id = a.id
            and p.user_id = auth.uid()
            and p.status in ('active','paused','completed')
        )
        or exists (
          select 1 from public.program_exercise_videos ev
          join public.programs p on p.id = ev.program_id
          where ev.asset_id = a.id
            and p.user_id = auth.uid()
            and p.status in ('active','paused','completed')
        )
        or exists (
          select 1 from public.program_day_assets da
          join public.program_days d on d.id = da.program_day_id
          join public.programs p on p.id = d.program_id
          where da.asset_id = a.id
            and p.user_id = auth.uid()
            and p.status in ('active','paused','completed')
        )
        or exists (
          select 1 from public.program_blocks b
          join public.programs p on p.id = b.program_id
          where b.asset_id = a.id
            and p.user_id = auth.uid()
            and p.status in ('active','paused','completed')
        )
      )
  );
$$;

revoke all on function private.can_read_program_media(text) from public;
grant execute on function private.can_read_program_media(text) to authenticated;

update public.template_versions
set status = 'archived', updated_at = now()
where id = '10000000-0000-4000-8000-000000000002'
  and status = 'published';

update public.template_versions
set status = 'published', published_at = now(), updated_at = now()
where id = '10000000-0000-4000-8000-000000000004'
  and status = 'draft';
