create table public.weekly_schedule_slots (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  week_number smallint not null check (week_number between 1 and 12),
  session_position smallint not null check (session_position between 1 and 4),
  program_day_id uuid not null references public.program_days(id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 48),
  scheduled_date date not null,
  confirmed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, week_number, session_position),
  unique (program_id, day_number),
  unique (program_id, week_number, scheduled_date)
);

create index weekly_schedule_slots_user_week_idx
on public.weekly_schedule_slots(user_id, program_id, week_number);

create trigger weekly_schedule_slots_set_updated_at
before update on public.weekly_schedule_slots
for each row execute function private.set_updated_at();

alter table public.weekly_schedule_slots enable row level security;

create policy weekly_schedule_slots_customer_read
on public.weekly_schedule_slots
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy weekly_schedule_slots_admin_all
on public.weekly_schedule_slots
for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

revoke all on table public.weekly_schedule_slots from anon;
revoke insert, update, delete on table public.weekly_schedule_slots from authenticated;
grant select on table public.weekly_schedule_slots to authenticated;

create or replace function public.save_weekly_schedule(
  p_program_id uuid,
  p_week_number integer,
  p_dates date[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program public.programs%rowtype;
  v_completed integer;
  v_expected_week integer;
  v_position integer;
  v_day_number integer;
  v_program_day_id uuid;
  v_completed_date date;
  v_today date := (now() at time zone 'Asia/Yangon')::date;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into v_program
  from public.programs
  where id = p_program_id
  for update;

  if not found or (v_program.user_id <> auth.uid() and not private.is_admin()) then
    raise exception 'Program not found' using errcode = '42501';
  end if;
  if v_program.status <> 'active' then
    raise exception 'Program is not active';
  end if;

  select count(distinct day_number) into v_completed
  from public.workout_sessions
  where program_id = p_program_id and status = 'completed';

  if v_completed >= 48 then
    raise exception 'Program is already complete';
  end if;

  v_expected_week := floor(v_completed / 4.0)::integer + 1;
  if p_week_number <> v_expected_week then
    raise exception 'Only the current week can be scheduled';
  end if;

  if coalesce(array_length(p_dates, 1), 0) <> 4
     or exists (select 1 from unnest(p_dates) as requested_date where requested_date is null) then
    raise exception 'Choose all four training dates';
  end if;

  if not (p_dates[1] < p_dates[2] and p_dates[2] < p_dates[3] and p_dates[3] < p_dates[4]) then
    raise exception 'Training dates must be in order and cannot repeat';
  end if;

  if p_dates[3] <= p_dates[2] + 1 then
    raise exception 'Keep at least one rest day between sessions two and three';
  end if;

  for v_position in 1..4 loop
    v_day_number := ((p_week_number - 1) * 4) + v_position;

    select id into v_program_day_id
    from public.program_days
    where program_id = p_program_id and day_number = v_day_number;
    if not found then
      raise exception 'Program day % is not configured', v_day_number;
    end if;

    v_completed_date := null;
    select local_date::date into v_completed_date
    from public.workout_sessions
    where program_id = p_program_id
      and day_number = v_day_number
      and status = 'completed';

    if v_completed_date is not null and p_dates[v_position] <> v_completed_date then
      raise exception 'Completed training dates cannot be changed';
    elsif v_completed_date is null and p_dates[v_position] < v_today then
      raise exception 'Upcoming training dates cannot be in the past';
    end if;

    insert into public.weekly_schedule_slots (
      program_id,
      user_id,
      week_number,
      session_position,
      program_day_id,
      day_number,
      scheduled_date,
      confirmed_at
    ) values (
      p_program_id,
      v_program.user_id,
      p_week_number,
      v_position,
      v_program_day_id,
      v_day_number,
      p_dates[v_position],
      now()
    )
    on conflict (program_id, week_number, session_position)
    do update set
      program_day_id = excluded.program_day_id,
      day_number = excluded.day_number,
      scheduled_date = excluded.scheduled_date,
      confirmed_at = excluded.confirmed_at,
      updated_at = now();
  end loop;

  return jsonb_build_object(
    'saved', true,
    'week_number', p_week_number,
    'dates', p_dates,
    'confirmed_at', now()
  );
end;
$$;

revoke all on function public.save_weekly_schedule(uuid, integer, date[]) from public;
grant execute on function public.save_weekly_schedule(uuid, integer, date[]) to authenticated;

create or replace function private.enforce_weekly_schedule_gate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_week_number integer;
begin
  if auth.role() = 'service_role' or private.is_admin() then
    return new;
  end if;

  v_week_number := floor((new.day_number - 1) / 4.0)::integer + 1;
  if not exists (
    select 1
    from public.weekly_schedule_slots slot
    where slot.program_id = new.program_id
      and slot.user_id = new.user_id
      and slot.week_number = v_week_number
      and slot.day_number = new.day_number
  ) then
    raise exception 'Save this week schedule before starting a workout' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_weekly_schedule_gate() from public;

create trigger workout_sessions_weekly_schedule_gate
before insert on public.workout_sessions
for each row execute function private.enforce_weekly_schedule_gate();
