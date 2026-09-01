alter table public.template_blocks drop constraint if exists template_blocks_block_type_check;
alter table public.template_blocks add constraint template_blocks_block_type_check
check (block_type in (
  'heading','rich_text','callout','divider','spacer','image','video','pdf','file',
  'timer','checklist','stat','button','link','columns','exercise','exercise_cue','quiz'
));

create or replace function public.clone_template_version(p_source_version_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source public.template_versions%rowtype;
  v_new_version_id uuid := gen_random_uuid();
  v_next_version integer;
begin
  if not private.is_admin()
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Admin authorization required' using errcode = '42501';
  end if;

  select * into v_source
  from public.template_versions
  where id = p_source_version_id;
  if not found then raise exception 'Template version not found'; end if;

  perform 1 from public.program_templates where id = v_source.template_id for update;
  select coalesce(max(version_no), 0) + 1 into v_next_version
  from public.template_versions
  where template_id = v_source.template_id;

  insert into public.template_versions (
    id, template_id, version_no, status, name_mm, name_en, created_by
  ) values (
    v_new_version_id, v_source.template_id, v_next_version, 'draft',
    v_source.name_mm, v_source.name_en, auth.uid()
  );

  insert into public.template_documents (
    id, template_version_id, screen_key, day_number, title_mm, title_en, position
  )
  select md5(v_new_version_id::text || '-document-' || id::text)::uuid, v_new_version_id,
         screen_key, day_number, title_mm, title_en, position
  from public.template_documents
  where template_version_id = p_source_version_id;

  insert into public.template_blocks (
    id, document_id, parent_id, position, block_type, title_mm, title_en,
    content_mm, content_en, config, asset_id, visible
  )
  select md5(v_new_version_id::text || '-block-' || b.id::text)::uuid,
         md5(v_new_version_id::text || '-document-' || b.document_id::text)::uuid,
         case when b.parent_id is null then null else md5(v_new_version_id::text || '-block-' || b.parent_id::text)::uuid end,
         b.position, b.block_type, b.title_mm, b.title_en,
         b.content_mm, b.content_en, b.config, b.asset_id, b.visible
  from public.template_blocks b
  join public.template_documents d on d.id = b.document_id
  where d.template_version_id = p_source_version_id;

  insert into public.template_exercises (
    id, template_version_id, slug, name_mm, name_en, cue_mm, cue_en,
    video_asset_id, pattern, equipment_mm, equipment_en, kg_increment,
    is_big_four, unilateral, body_part, is_assessment_only, position
  )
  select md5(v_new_version_id::text || '-exercise-' || id::text)::uuid, v_new_version_id,
         slug, name_mm, name_en, cue_mm, cue_en, video_asset_id, pattern,
         equipment_mm, equipment_en, kg_increment, is_big_four, unilateral,
         body_part, is_assessment_only, position
  from public.template_exercises
  where template_version_id = p_source_version_id;

  insert into public.template_exercise_videos (
    id, template_exercise_id, position, role, asset_id,
    title_mm, title_en, cue_mm, cue_en
  )
  select md5(v_new_version_id::text || '-exercise-video-' || v.id::text)::uuid,
         md5(v_new_version_id::text || '-exercise-' || v.template_exercise_id::text)::uuid,
         v.position, v.role, v.asset_id, v.title_mm, v.title_en, v.cue_mm, v.cue_en
  from public.template_exercise_videos v
  join public.template_exercises e on e.id = v.template_exercise_id
  where e.template_version_id = p_source_version_id;

  insert into public.template_days (
    id, template_version_id, day_number, day_type, phase, title_mm, title_en
  )
  select md5(v_new_version_id::text || '-day-' || id::text)::uuid, v_new_version_id,
         day_number, day_type, phase, title_mm, title_en
  from public.template_days
  where template_version_id = p_source_version_id;

  insert into public.template_day_items (
    id, template_day_id, template_exercise_id, position, sets,
    reps_min, reps_max, target_kg, rest_seconds, effort
  )
  select md5(v_new_version_id::text || '-day-item-' || i.id::text)::uuid,
         md5(v_new_version_id::text || '-day-' || i.template_day_id::text)::uuid,
         md5(v_new_version_id::text || '-exercise-' || i.template_exercise_id::text)::uuid,
         i.position, i.sets, i.reps_min, i.reps_max,
         i.target_kg, i.rest_seconds, i.effort
  from public.template_day_items i
  join public.template_days d on d.id = i.template_day_id
  where d.template_version_id = p_source_version_id;

  insert into public.template_day_assets (
    id, template_day_id, position, kind, asset_id,
    title_mm, title_en, duration_seconds
  )
  select md5(v_new_version_id::text || '-day-asset-' || a.id::text)::uuid,
         md5(v_new_version_id::text || '-day-' || a.template_day_id::text)::uuid,
         a.position, a.kind, a.asset_id, a.title_mm, a.title_en, a.duration_seconds
  from public.template_day_assets a
  join public.template_days d on d.id = a.template_day_id
  where d.template_version_id = p_source_version_id;

  insert into public.template_assessment_movements (
    id, template_version_id, assessment_kind, position, name_mm, name_en,
    equipment_mm, equipment_en, rest_seconds
  )
  select md5(v_new_version_id::text || '-assessment-' || id::text)::uuid, v_new_version_id,
         assessment_kind, position, name_mm, name_en,
         equipment_mm, equipment_en, rest_seconds
  from public.template_assessment_movements
  where template_version_id = p_source_version_id;

  insert into public.template_quiz_questions (
    id, template_version_id, position, question_mm, question_en,
    explanation_mm, explanation_en
  )
  select md5(v_new_version_id::text || '-question-' || id::text)::uuid, v_new_version_id,
         position, question_mm, question_en, explanation_mm, explanation_en
  from public.template_quiz_questions
  where template_version_id = p_source_version_id;

  insert into public.template_quiz_options (
    id, question_id, position, text_mm, text_en, is_correct
  )
  select md5(v_new_version_id::text || '-option-' || o.id::text)::uuid,
         md5(v_new_version_id::text || '-question-' || o.question_id::text)::uuid,
         o.position, o.text_mm, o.text_en, o.is_correct
  from public.template_quiz_options o
  join public.template_quiz_questions q on q.id = o.question_id
  where q.template_version_id = p_source_version_id;

  return v_new_version_id;
end;
$$;

revoke all on function public.clone_template_version(uuid) from public;
grant execute on function public.clone_template_version(uuid) to authenticated;
