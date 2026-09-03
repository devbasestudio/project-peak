-- Keep Day 48 aligned with the signed-off member flow: it is the final
-- assessment, not another regular Pull workout.

alter table public.template_day_items disable trigger template_day_items_draft_only;
alter table public.template_days disable trigger template_days_draft_only;

update public.template_days
set day_type = 'challenge',
    phase = 2,
    title_mm = 'နောက်ဆုံးနေ့ စမ်းသပ်မှု',
    title_en = 'Final challenge',
    updated_at = now()
where day_number = 48;

delete from public.template_day_items item
using public.template_days day
where day.id = item.template_day_id
  and day.day_number = 48;

with challenge(slug, position) as (
  values
    ('push-up-test', 1),
    ('wide-pull-up', 2),
    ('lateral-raise', 3),
    ('sissy-squat', 4)
)
insert into public.template_day_items (
  template_day_id, template_exercise_id, position, sets,
  reps_min, reps_max, target_kg, rest_seconds, effort
)
select
  day.id,
  exercise.id,
  challenge.position,
  1,
  0,
  999,
  0,
  180,
  'max_clean_reps'
from public.template_days day
join challenge on true
join public.template_exercises exercise
  on exercise.template_version_id = day.template_version_id
 and exercise.slug = challenge.slug
where day.day_number = 48
on conflict (template_day_id, position) do update
set template_exercise_id = excluded.template_exercise_id,
    sets = excluded.sets,
    reps_min = excluded.reps_min,
    reps_max = excluded.reps_max,
    target_kg = excluded.target_kg,
    rest_seconds = excluded.rest_seconds,
    effort = excluded.effort,
    updated_at = now();

alter table public.template_days enable trigger template_days_draft_only;
alter table public.template_day_items enable trigger template_day_items_draft_only;

-- Repair assigned programs that have not started Day 48 yet.
update public.program_days day
set day_type = 'challenge',
    phase = 2,
    title_mm = 'နောက်ဆုံးနေ့ စမ်းသပ်မှု',
    title_en = 'Final challenge'
where day.day_number = 48
  and not exists (
    select 1
    from public.workout_sessions session
    where session.program_id = day.program_id
      and session.day_number = 48
  );

delete from public.program_day_items item
using public.program_days day
where day.id = item.program_day_id
  and day.day_number = 48
  and not exists (
    select 1
    from public.workout_sessions session
    where session.program_id = day.program_id
      and session.day_number = 48
  );

with challenge(slug, position) as (
  values
    ('push-up-test', 1),
    ('wide-pull-up', 2),
    ('lateral-raise', 3),
    ('sissy-squat', 4)
)
insert into public.program_day_items (
  program_day_id, program_exercise_id, position, sets,
  reps_min, reps_max, target_kg, rest_seconds, effort
)
select
  day.id,
  exercise.id,
  challenge.position,
  1,
  0,
  999,
  0,
  180,
  'max_clean_reps'
from public.program_days day
join challenge on true
join public.program_exercises exercise
  on exercise.program_id = day.program_id
 and exercise.slug = challenge.slug
where day.day_number = 48
  and not exists (
    select 1
    from public.workout_sessions session
    where session.program_id = day.program_id
      and session.day_number = 48
  )
on conflict (program_day_id, position) do update
set program_exercise_id = excluded.program_exercise_id,
    sets = excluded.sets,
    reps_min = excluded.reps_min,
    reps_max = excluded.reps_max,
    target_kg = excluded.target_kg,
    rest_seconds = excluded.rest_seconds,
    effort = excluded.effort,
    updated_at = now();

create or replace function private.force_day_48_challenge()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.day_number = 48 then
    new.day_type := 'challenge';
    new.phase := 2;
    new.title_mm := 'နောက်ဆုံးနေ့ စမ်းသပ်မှု';
    new.title_en := 'Final challenge';
  end if;
  return new;
end;
$$;

revoke all on function private.force_day_48_challenge() from public, anon, authenticated;

drop trigger if exists program_day_48_is_challenge on public.program_days;
create trigger program_day_48_is_challenge
before insert or update of day_number, day_type on public.program_days
for each row execute function private.force_day_48_challenge();

-- Enforce the selected date in the database as well as in the UI. A direct
-- RPC call must not be able to start or complete a future session.
create or replace function private.enforce_weekly_schedule_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_week_number integer;
  v_scheduled_date date;
  v_today date := (now() at time zone 'Asia/Yangon')::date;
begin
  if auth.role() = 'service_role' or private.is_admin() then
    return new;
  end if;

  v_week_number := floor((new.day_number - 1) / 4.0)::integer + 1;
  select slot.scheduled_date into v_scheduled_date
  from public.weekly_schedule_slots slot
  where slot.program_id = new.program_id
    and slot.user_id = new.user_id
    and slot.week_number = v_week_number
    and slot.day_number = new.day_number;

  if v_scheduled_date is null then
    raise exception 'Save this week schedule before starting a workout' using errcode = '42501';
  end if;
  if v_scheduled_date > v_today then
    raise exception 'This workout is scheduled for a future date' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_weekly_schedule_gate() from public, anon, authenticated;

create or replace function public.complete_final_challenge(
  p_program_id uuid,
  p_local_date text,
  p_values jsonb,
  p_mutation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_completed integer;
  v_allowed_count integer;
  v_supplied_count integer;
  v_attempt_id uuid;
  v_session_id uuid;
  v_scheduled_date text;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_local_date !~ '^\d{4}-\d{2}-\d{2}$' or jsonb_typeof(p_values) <> 'array' then
    raise exception 'Invalid final challenge payload' using errcode = '22023';
  end if;

  perform 1
  from public.programs
  where id = p_program_id
    and user_id = v_user_id
    and status = 'active'
  for update;
  if not found then
    raise exception 'Active program not found' using errcode = 'P0002';
  end if;

  select count(distinct day_number) into v_completed
  from public.workout_sessions
  where program_id = p_program_id
    and status = 'completed'
    and day_number < 48;
  if v_completed <> 47 then
    raise exception 'Complete Sessions 1 through 47 before the final challenge' using errcode = '55000';
  end if;

  select scheduled_date into v_scheduled_date
  from public.weekly_schedule_slots
  where program_id = p_program_id and day_number = 48;
  if v_scheduled_date is null then
    raise exception 'Schedule Day 48 before starting the final challenge' using errcode = '55000';
  end if;
  if v_scheduled_date > p_local_date then
    raise exception 'The final challenge date has not arrived yet' using errcode = '55000';
  end if;

  select count(*) into v_allowed_count
  from public.program_assessment_movements
  where program_id = p_program_id and assessment_kind = 'final';

  select count(distinct (item ->> 'movementId')::uuid) into v_supplied_count
  from jsonb_array_elements(p_values) item
  where (item ->> 'movementId') ~* '^[0-9a-f-]{36}$'
    and (item ->> 'value') ~ '^\d{1,3}$'
    and (item ->> 'value')::integer between 0 and 999;

  if v_allowed_count = 0
     or v_supplied_count <> v_allowed_count
     or exists (
       select 1
       from jsonb_array_elements(p_values) item
       left join public.program_assessment_movements movement
         on movement.id = (item ->> 'movementId')::uuid
        and movement.program_id = p_program_id
        and movement.assessment_kind = 'final'
       where movement.id is null
          or (item ->> 'value') !~ '^\d{1,3}$'
          or (item ->> 'value')::integer not between 0 and 999
     ) then
    raise exception 'Final movements must exactly match the assigned program' using errcode = '22023';
  end if;

  update public.program_days
  set day_type = 'challenge', phase = 2,
      title_mm = 'နောက်ဆုံးနေ့ စမ်းသပ်မှု', title_en = 'Final challenge'
  where program_id = p_program_id and day_number = 48;

  insert into public.workout_sessions (
    program_id, user_id, day_number, session_type, status,
    local_date, mutation_id, started_at, completed_at
  ) values (
    p_program_id, v_user_id, 48, 'challenge', 'completed',
    p_local_date, p_mutation_id, now(), now()
  )
  on conflict (program_id, day_number) do update
  set user_id = excluded.user_id,
      session_type = 'challenge',
      status = 'completed',
      local_date = excluded.local_date,
      mutation_id = coalesce(public.workout_sessions.mutation_id, excluded.mutation_id),
      completed_at = coalesce(public.workout_sessions.completed_at, now()),
      updated_at = now()
  returning id into v_session_id;

  insert into public.assessment_attempts (
    program_id, user_id, kind, status, local_date, completed_at
  ) values (
    p_program_id, v_user_id, 'final', 'completed', p_local_date, now()
  )
  on conflict (program_id, kind) do update
  set user_id = excluded.user_id,
      status = 'completed',
      local_date = excluded.local_date,
      completed_at = now(),
      updated_at = now()
  returning id into v_attempt_id;

  delete from public.assessment_results where attempt_id = v_attempt_id;
  insert into public.assessment_results (attempt_id, movement_id, value)
  select v_attempt_id, (item ->> 'movementId')::uuid, (item ->> 'value')::integer
  from jsonb_array_elements(p_values) item;

  update public.programs
  set completed_at = coalesce(completed_at, now()), updated_at = now()
  where id = p_program_id;

  insert into public.sync_receipts (mutation_id, user_id, entity_type, entity_id)
  values (p_mutation_id, v_user_id, 'final_challenge', v_session_id)
  on conflict (mutation_id) do nothing;

  return jsonb_build_object(
    'completed', true,
    'day_number', 48,
    'session_id', v_session_id,
    'assessment_attempt_id', v_attempt_id
  );
end;
$$;

revoke all on function public.complete_final_challenge(uuid, text, jsonb, uuid) from public, anon;
grant execute on function public.complete_final_challenge(uuid, text, jsonb, uuid) to authenticated;

do $$
begin
  if exists (select 1 from public.template_days where day_number = 48 and day_type <> 'challenge') then
    raise exception 'Template Day 48 repair failed';
  end if;
end;
$$;
