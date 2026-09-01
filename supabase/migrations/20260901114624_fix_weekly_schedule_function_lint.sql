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
  end loop;

  delete from public.weekly_schedule_slots slot
  where slot.program_id = p_program_id
    and slot.week_number = p_week_number
    and not exists (
      select 1 from public.workout_sessions session
      where session.program_id = slot.program_id
        and session.day_number = slot.day_number
        and session.status = 'completed'
    );

  for v_position in 1..4 loop
    v_day_number := ((p_week_number - 1) * 4) + v_position;

    select id into v_program_day_id
    from public.program_days
    where program_id = p_program_id and day_number = v_day_number;
    if not found then
      raise exception 'Program day % is not configured', v_day_number;
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
