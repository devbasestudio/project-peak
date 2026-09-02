-- Project Peak production hardening.
-- All multi-step mutations below execute as one PostgreSQL transaction. Any
-- exception rolls the complete operation back, preserving the previous state.

create or replace function public.save_template_draft(
  p_template_id uuid,
  p_version_id uuid,
  p_slug text,
  p_name_mm text,
  p_name_en text,
  p_description_mm text,
  p_description_en text,
  p_documents jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requested public.template_versions%rowtype;
  v_version_id uuid;
  v_document jsonb;
  v_block jsonb;
  v_document_id uuid;
  v_document_position integer := 0;
  v_block_position integer;
begin
  if not private.is_admin() then
    raise exception 'Admin authorization required' using errcode = '42501';
  end if;
  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or length(p_slug) not between 2 and 80
     or nullif(btrim(p_name_mm), '') is null
     or nullif(btrim(p_name_en), '') is null then
    raise exception 'Invalid template metadata' using errcode = '22023';
  end if;
  if jsonb_typeof(p_documents) <> 'array'
     or jsonb_array_length(p_documents) not between 1 and 80 then
    raise exception 'Template must contain between 1 and 80 documents' using errcode = '22023';
  end if;

  perform 1 from public.program_templates where id = p_template_id for update;
  if not found then raise exception 'Template not found' using errcode = 'P0002'; end if;

  select * into v_requested
  from public.template_versions
  where id = p_version_id and template_id = p_template_id
  for update;
  if not found then raise exception 'Template version not found' using errcode = 'P0002'; end if;

  if v_requested.status = 'draft' then
    v_version_id := v_requested.id;
  else
    v_version_id := public.clone_template_version(v_requested.id);
  end if;

  update public.program_templates
  set slug = p_slug,
      name_mm = btrim(p_name_mm),
      name_en = btrim(p_name_en),
      description_mm = p_description_mm,
      description_en = p_description_en,
      updated_at = now()
  where id = p_template_id;
  if not found then raise exception 'Template update failed' using errcode = 'P0002'; end if;

  update public.template_versions
  set name_mm = btrim(p_name_mm), name_en = btrim(p_name_en), updated_at = now()
  where id = v_version_id and template_id = p_template_id and status = 'draft';
  if not found then raise exception 'Draft version is no longer editable' using errcode = '55000'; end if;

  delete from public.template_documents where template_version_id = v_version_id;

  for v_document in select value from jsonb_array_elements(p_documents)
  loop
    v_document_position := v_document_position + 1;
    if coalesce(v_document ->> 'screenKey', '') !~ '^[a-z0-9_]+$'
       or nullif(btrim(v_document ->> 'titleMm'), '') is null
       or nullif(btrim(v_document ->> 'titleEn'), '') is null
       or jsonb_typeof(coalesce(v_document -> 'blocks', '[]'::jsonb)) <> 'array'
       or jsonb_array_length(coalesce(v_document -> 'blocks', '[]'::jsonb)) > 250 then
      raise exception 'Invalid template document at position %', v_document_position using errcode = '22023';
    end if;

    insert into public.template_documents (
      template_version_id, screen_key, day_number, title_mm, title_en, position
    ) values (
      v_version_id,
      v_document ->> 'screenKey',
      case when jsonb_typeof(v_document -> 'dayNumber') = 'number' then (v_document ->> 'dayNumber')::smallint else null end,
      btrim(v_document ->> 'titleMm'),
      btrim(v_document ->> 'titleEn'),
      v_document_position
    ) returning id into v_document_id;

    v_block_position := 0;
    for v_block in select value from jsonb_array_elements(coalesce(v_document -> 'blocks', '[]'::jsonb))
    loop
      v_block_position := v_block_position + 1;
      insert into public.template_blocks (
        document_id, parent_id, position, block_type, title_mm, title_en,
        content_mm, content_en, config, visible
      ) values (
        v_document_id,
        null,
        v_block_position,
        v_block ->> 'blockType',
        nullif(v_block ->> 'titleMm', ''),
        nullif(v_block ->> 'titleEn', ''),
        coalesce(v_block -> 'contentMm', '{}'::jsonb),
        coalesce(v_block -> 'contentEn', '{}'::jsonb),
        coalesce(v_block -> 'config', '{}'::jsonb),
        coalesce((v_block ->> 'visible')::boolean, true)
      );
    end loop;
  end loop;

  return v_version_id;
end;
$$;

revoke all on function public.save_template_draft(uuid, uuid, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.save_template_draft(uuid, uuid, text, text, text, text, text, jsonb) to service_role;
grant execute on function public.clone_template_version(uuid) to service_role;

create or replace function public.publish_template_version_atomic(
  p_template_id uuid,
  p_version_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.template_status;
begin
  if not private.is_admin() then
    raise exception 'Admin authorization required' using errcode = '42501';
  end if;

  perform 1 from public.program_templates where id = p_template_id for update;
  if not found then raise exception 'Template not found' using errcode = 'P0002'; end if;

  select status into v_status
  from public.template_versions
  where id = p_version_id and template_id = p_template_id
  for update;
  if not found then raise exception 'Template version not found' using errcode = 'P0002'; end if;
  if v_status <> 'draft' then
    raise exception 'Only a draft version can be published' using errcode = '55000';
  end if;

  update public.template_versions
  set status = 'archived', updated_at = now()
  where template_id = p_template_id and status = 'published' and id <> p_version_id;

  update public.template_versions
  set status = 'published', published_at = now(), updated_at = now()
  where id = p_version_id and template_id = p_template_id and status = 'draft';
  if not found then raise exception 'Draft publish lost a concurrent update' using errcode = '40001'; end if;

  return p_version_id;
end;
$$;

revoke all on function public.publish_template_version_atomic(uuid, uuid) from public, anon, authenticated;
grant execute on function public.publish_template_version_atomic(uuid, uuid) to service_role;

create or replace function public.reject_payment_order_atomic(
  p_order_id uuid,
  p_reviewer_id uuid,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.payment_orders%rowtype;
begin
  if not private.is_admin() then
    raise exception 'Admin authorization required' using errcode = '42501';
  end if;
  select * into v_order from public.payment_orders where id = p_order_id for update;
  if not found then raise exception 'Payment order not found' using errcode = 'P0002'; end if;
  if v_order.status not in ('awaiting_payment', 'submitted') then
    raise exception 'Only awaiting or submitted orders may be rejected' using errcode = '55000';
  end if;

  update public.payment_orders
  set status = 'rejected', rejected_at = now(), reviewed_by = p_reviewer_id,
      review_note = nullif(btrim(p_note), ''), updated_at = now()
  where id = p_order_id;

  insert into public.payment_reviews(order_id, reviewer_id, from_status, to_status, note)
  values (p_order_id, p_reviewer_id, v_order.status, 'rejected', nullif(btrim(p_note), ''));
  return p_order_id;
end;
$$;

revoke all on function public.reject_payment_order_atomic(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.reject_payment_order_atomic(uuid, uuid, text) to service_role;

create or replace function public.update_program_status_strict(
  p_program_id uuid,
  p_status public.program_status
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin authorization required' using errcode = '42501';
  end if;
  if p_status not in ('active', 'paused', 'completed') then
    raise exception 'Unsupported program status' using errcode = '22023';
  end if;
  update public.programs
  set status = p_status,
      completed_at = case when p_status = 'completed' then coalesce(completed_at, now()) else null end,
      updated_at = now()
  where id = p_program_id;
  if not found then raise exception 'Program not found' using errcode = 'P0002'; end if;
  return p_program_id;
end;
$$;

revoke all on function public.update_program_status_strict(uuid, public.program_status) from public, anon, authenticated;
grant execute on function public.update_program_status_strict(uuid, public.program_status) to service_role;
grant execute on function public.approve_payment_order(uuid, uuid) to service_role;

create or replace function public.get_or_create_payment_order()
returns public.payment_orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.payment_orders%rowtype;
  v_offer public.offers%rowtype;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select * into v_order
  from public.payment_orders
  where user_id = v_user_id and status in ('awaiting_payment', 'submitted', 'approved')
  order by created_at desc limit 1 for update;
  if found then return v_order; end if;

  select * into v_offer from public.offers where active order by created_at asc limit 1;
  if not found then raise exception 'Active offer is unavailable' using errcode = 'P0002'; end if;

  insert into public.payment_orders(
    user_id, offer_id, amount_minor, currency, reference_code, status
  ) values (
    v_user_id, v_offer.id, v_offer.price_minor, v_offer.currency,
    'PEAK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    'awaiting_payment'
  ) returning * into v_order;
  return v_order;
end;
$$;

revoke all on function public.get_or_create_payment_order() from public, anon;
grant execute on function public.get_or_create_payment_order() to authenticated;

create or replace function public.save_baseline_assessment(
  p_program_id uuid,
  p_local_date text,
  p_values jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_attempt_id uuid;
  v_allowed_count integer;
  v_supplied_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_local_date !~ '^\d{4}-\d{2}-\d{2}$' or jsonb_typeof(p_values) <> 'array' then
    raise exception 'Invalid baseline payload' using errcode = '22023';
  end if;
  perform 1 from public.programs
  where id = p_program_id and user_id = v_user_id and status = 'active'
  for update;
  if not found then raise exception 'Active program not found' using errcode = 'P0002'; end if;

  select count(*) into v_allowed_count
  from public.program_assessment_movements
  where program_id = p_program_id and assessment_kind = 'baseline';

  select count(distinct (item ->> 'movementId')::uuid) into v_supplied_count
  from jsonb_array_elements(p_values) item
  where (item ->> 'movementId') ~* '^[0-9a-f-]{36}$'
    and (item ->> 'value') ~ '^\d{1,3}$'
    and (item ->> 'value')::integer between 0 and 999;

  if v_allowed_count = 0 or v_supplied_count <> v_allowed_count
     or exists (
       select 1 from jsonb_array_elements(p_values) item
       left join public.program_assessment_movements movement
         on movement.id = (item ->> 'movementId')::uuid
        and movement.program_id = p_program_id
        and movement.assessment_kind = 'baseline'
       where movement.id is null
          or (item ->> 'value') !~ '^\d{1,3}$'
          or (item ->> 'value')::integer not between 0 and 999
     ) then
    raise exception 'Baseline movements must exactly match the assigned program' using errcode = '22023';
  end if;

  insert into public.assessment_attempts(
    program_id, user_id, kind, status, local_date, completed_at
  ) values (
    p_program_id, v_user_id, 'baseline', 'completed', p_local_date, now()
  )
  on conflict (program_id, kind) do update
  set user_id = excluded.user_id, status = 'completed', local_date = excluded.local_date,
      completed_at = now(), updated_at = now()
  returning id into v_attempt_id;

  delete from public.assessment_results where attempt_id = v_attempt_id;
  insert into public.assessment_results(attempt_id, movement_id, value)
  select v_attempt_id, (item ->> 'movementId')::uuid, (item ->> 'value')::integer
  from jsonb_array_elements(p_values) item;

  return v_attempt_id;
end;
$$;

revoke all on function public.save_baseline_assessment(uuid, text, jsonb) from public, anon;
grant execute on function public.save_baseline_assessment(uuid, text, jsonb) to authenticated;

create or replace function public.save_coaching_weekly_schedule(p_schedule jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_day jsonb;
  v_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(p_schedule) <> 'array' or jsonb_array_length(p_schedule) <> 7 then
    raise exception 'A complete seven-day schedule is required' using errcode = '22023';
  end if;
  select count(distinct (item ->> 'dayOfWeek')::integer) into v_count
  from jsonb_array_elements(p_schedule) item
  where (item ->> 'dayOfWeek') ~ '^\d$' and (item ->> 'dayOfWeek')::integer between 0 and 6;
  if v_count <> 7 then raise exception 'Schedule days must be unique' using errcode = '22023'; end if;

  for v_day in select value from jsonb_array_elements(p_schedule)
  loop
    if not coalesce((v_day ->> 'isRest')::boolean, false)
       and nullif(btrim(v_day ->> 'splitName'), '') is null then
      raise exception 'Workout days require a split name' using errcode = '22023';
    end if;
    insert into public.coaching_weekly_schedule(user_id, day_of_week, split_name, is_rest)
    values (
      v_user_id,
      (v_day ->> 'dayOfWeek')::smallint,
      case when coalesce((v_day ->> 'isRest')::boolean, false) then null else left(btrim(v_day ->> 'splitName'), 80) end,
      coalesce((v_day ->> 'isRest')::boolean, false)
    )
    on conflict(user_id, day_of_week) do update
    set split_name = excluded.split_name, is_rest = excluded.is_rest;
  end loop;

  update public.coaching_profiles
  set onboarding_complete = true, updated_at = now()
  where id = v_user_id;
  if not found then raise exception 'Coaching profile not found' using errcode = 'P0002'; end if;

  insert into public.coaching_programs(
    user_id, duration_weeks, target_calories, macros_p, macros_c, macros_f,
    program_type, start_date
  ) values (
    v_user_id, 12, 1800, 150, 180, 50, 'custom_plan', current_date
  ) on conflict(user_id) do nothing;
end;
$$;

revoke all on function public.save_coaching_weekly_schedule(jsonb) from public, anon;
grant execute on function public.save_coaching_weekly_schedule(jsonb) to authenticated;

create or replace function public.submit_coaching_registration(
  p_name text,
  p_phone text,
  p_age integer,
  p_height integer,
  p_weight numeric,
  p_photo_front text,
  p_photo_back text,
  p_photo_side text,
  p_intake_answers jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_registration public.coaching_registrations%rowtype;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if nullif(btrim(p_name), '') is null or length(p_name) > 120
     or nullif(btrim(p_phone), '') is null or length(p_phone) > 40
     or p_age not between 13 and 100
     or p_height not between 80 and 260
     or p_weight not between 20 and 500
     or jsonb_typeof(p_intake_answers) <> 'object' then
    raise exception 'Invalid coaching registration details' using errcode = '22023';
  end if;
  if p_photo_front not like 'private:' || v_user_id::text || '/intake/%'
     or p_photo_back not like 'private:' || v_user_id::text || '/intake/%'
     or p_photo_side not like 'private:' || v_user_id::text || '/intake/%' then
    raise exception 'Body photo ownership mismatch' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 1));
  select * into v_registration
  from public.coaching_registrations
  where user_id = v_user_id
  for update;
  if found and v_registration.status <> 'rejected' and v_registration.payment_status <> 'rejected' then
    raise exception 'Registration was already submitted' using errcode = '23505';
  end if;

  insert into public.coaching_registrations(
    user_id, name, email, phone, age, height, weight, program_key, program_name,
    duration_months, program_price, payment_method, payment_screenshot,
    payment_status, status, photo_front, photo_back, photo_side, intake_answers
  ) values (
    v_user_id, btrim(p_name), coalesce(auth.jwt() ->> 'email', ''), btrim(p_phone),
    p_age, p_height::text, p_weight, 'one_on_one_12_weeks', 'Project Peak 1:1 Coaching',
    3, 550000, 'KBZPay', null, 'pending', 'pending',
    p_photo_front, p_photo_back, p_photo_side, p_intake_answers
  )
  on conflict(user_id) do update set
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone,
    age = excluded.age,
    height = excluded.height,
    weight = excluded.weight,
    program_key = excluded.program_key,
    program_name = excluded.program_name,
    duration_months = excluded.duration_months,
    program_price = excluded.program_price,
    payment_method = excluded.payment_method,
    payment_screenshot = null,
    payment_status = 'pending',
    status = 'pending',
    notes = null,
    photo_front = excluded.photo_front,
    photo_back = excluded.photo_back,
    photo_side = excluded.photo_side,
    intake_answers = excluded.intake_answers,
    approved_at = null,
    ready_at = null,
    updated_at = now()
  returning id into v_registration.id;

  return v_registration.id;
end;
$$;

revoke all on function public.submit_coaching_registration(text, text, integer, integer, numeric, text, text, text, jsonb) from public, anon;
grant execute on function public.submit_coaching_registration(text, text, integer, integer, numeric, text, text, text, jsonb) to authenticated;

-- Restore least-privilege authenticated access for the coaching member app.
-- Central admin continues to use service_role after its independent OTP gate.
do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'coaching_profiles','coaching_program_catalog','coaching_registrations','coaching_programs',
    'coaching_custom_tracker_templates','coaching_daily_trackers','coaching_journaling',
    'coaching_user_profiles','coaching_weekly_schedule','coaching_exercise_library',
    'coaching_workouts','coaching_workout_exercises','coaching_exercise_swaps',
    'coaching_nutrition_items','coaching_nutrition_logs','coaching_weekly_checkins',
    'coaching_motivational_quotes','coaching_user_devices'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('alter table public.%I enable row level security', relation_name);
      execute format('revoke all on table public.%I from anon, authenticated', relation_name);
    end if;
  end loop;
end
$$;

grant select on public.coaching_profiles to authenticated;
grant insert (id, username, email, avatar_url, onboarding_complete) on public.coaching_profiles to authenticated;
grant update (username, email, avatar_url, onboarding_complete, updated_at) on public.coaching_profiles to authenticated;
grant select on public.coaching_registrations to authenticated;
grant select on public.coaching_program_catalog, public.coaching_exercise_library, public.coaching_nutrition_items to anon, authenticated;
grant select on public.coaching_programs, public.coaching_custom_tracker_templates to authenticated;
grant select, insert, update, delete on public.coaching_daily_trackers, public.coaching_journaling,
  public.coaching_user_profiles, public.coaching_weekly_schedule, public.coaching_workouts,
  public.coaching_workout_exercises, public.coaching_exercise_swaps, public.coaching_nutrition_logs,
  public.coaching_weekly_checkins, public.coaching_motivational_quotes, public.coaching_user_devices
to authenticated;

do $$
declare
  seq_name text;
begin
  foreach seq_name in array array[
    'coaching_registrations_id_seq','coaching_daily_trackers_id_seq','coaching_journaling_id_seq',
    'coaching_user_profiles_id_seq','coaching_weekly_schedule_id_seq','coaching_workouts_id_seq',
    'coaching_workout_exercises_id_seq','coaching_exercise_swaps_id_seq','coaching_nutrition_logs_id_seq',
    'coaching_weekly_checkins_id_seq','coaching_motivational_quotes_id_seq','coaching_user_devices_id_seq'
  ] loop
    if to_regclass(format('public.%I', seq_name)) is not null then
      execute format('grant usage, select on sequence public.%I to authenticated', seq_name);
    end if;
  end loop;
end
$$;

drop policy if exists coaching_profiles_own_select on public.coaching_profiles;
create policy coaching_profiles_own_select on public.coaching_profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists coaching_profiles_own_insert on public.coaching_profiles;
create policy coaching_profiles_own_insert on public.coaching_profiles for insert to authenticated with check ((select auth.uid()) = id and role = 'user');
drop policy if exists coaching_profiles_own_update on public.coaching_profiles;
create policy coaching_profiles_own_update on public.coaching_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id and role = 'user');

drop policy if exists coaching_registrations_own_select on public.coaching_registrations;
create policy coaching_registrations_own_select on public.coaching_registrations for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists coaching_registrations_own_insert on public.coaching_registrations;
drop policy if exists coaching_registrations_own_update on public.coaching_registrations;

drop policy if exists coaching_program_catalog_public_read on public.coaching_program_catalog;
create policy coaching_program_catalog_public_read on public.coaching_program_catalog for select to anon, authenticated using (active);
drop policy if exists coaching_exercise_library_member_read on public.coaching_exercise_library;
create policy coaching_exercise_library_member_read on public.coaching_exercise_library for select to authenticated using (true);
drop policy if exists coaching_nutrition_items_member_read on public.coaching_nutrition_items;
create policy coaching_nutrition_items_member_read on public.coaching_nutrition_items for select to authenticated using (true);

drop policy if exists coaching_programs_own_select on public.coaching_programs;
create policy coaching_programs_own_select on public.coaching_programs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists coaching_custom_templates_own_select on public.coaching_custom_tracker_templates;
create policy coaching_custom_templates_own_select on public.coaching_custom_tracker_templates for select to authenticated using ((select auth.uid()) = user_id and active);

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'coaching_daily_trackers','coaching_journaling','coaching_user_profiles','coaching_weekly_schedule',
    'coaching_workouts','coaching_exercise_swaps','coaching_nutrition_logs','coaching_weekly_checkins',
    'coaching_motivational_quotes','coaching_user_devices'
  ] loop
    execute format('drop policy if exists %I on public.%I', relation_name || '_own_select', relation_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', relation_name || '_own_select', relation_name);
    execute format('drop policy if exists %I on public.%I', relation_name || '_own_insert', relation_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', relation_name || '_own_insert', relation_name);
    execute format('drop policy if exists %I on public.%I', relation_name || '_own_update', relation_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', relation_name || '_own_update', relation_name);
    execute format('drop policy if exists %I on public.%I', relation_name || '_own_delete', relation_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', relation_name || '_own_delete', relation_name);
  end loop;
end
$$;

drop policy if exists coaching_workout_exercises_own_select on public.coaching_workout_exercises;
create policy coaching_workout_exercises_own_select on public.coaching_workout_exercises for select to authenticated
using (exists (select 1 from public.coaching_workouts workout where workout.id = workout_id and workout.user_id = (select auth.uid())));
drop policy if exists coaching_workout_exercises_own_insert on public.coaching_workout_exercises;
create policy coaching_workout_exercises_own_insert on public.coaching_workout_exercises for insert to authenticated
with check (exists (select 1 from public.coaching_workouts workout where workout.id = workout_id and workout.user_id = (select auth.uid())));
drop policy if exists coaching_workout_exercises_own_update on public.coaching_workout_exercises;
create policy coaching_workout_exercises_own_update on public.coaching_workout_exercises for update to authenticated
using (exists (select 1 from public.coaching_workouts workout where workout.id = workout_id and workout.user_id = (select auth.uid())))
with check (exists (select 1 from public.coaching_workouts workout where workout.id = workout_id and workout.user_id = (select auth.uid())));
drop policy if exists coaching_workout_exercises_own_delete on public.coaching_workout_exercises;
create policy coaching_workout_exercises_own_delete on public.coaching_workout_exercises for delete to authenticated
using (exists (select 1 from public.coaching_workouts workout where workout.id = workout_id and workout.user_id = (select auth.uid())));

drop policy if exists coaching_user_photos_own_select on storage.objects;
create policy coaching_user_photos_own_select on storage.objects for select to authenticated
using (bucket_id = 'coaching-user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists coaching_user_photos_own_insert on storage.objects;
create policy coaching_user_photos_own_insert on storage.objects for insert to authenticated
with check (bucket_id = 'coaching-user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists coaching_user_photos_own_update on storage.objects;
create policy coaching_user_photos_own_update on storage.objects for update to authenticated
using (bucket_id = 'coaching-user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'coaching-user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists coaching_user_photos_own_delete on storage.objects;
create policy coaching_user_photos_own_delete on storage.objects for delete to authenticated
using (bucket_id = 'coaching-user-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
