-- Project Peak intake support
-- Safe to rerun in Supabase SQL Editor.
-- This file does not create sample packages. Create packages from Admin -> Programs.

ALTER TABLE IF EXISTS public.program_registrations
  ADD COLUMN IF NOT EXISTS program_key text,
  ADD COLUMN IF NOT EXISTS intake_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS photo_front text,
  ADD COLUMN IF NOT EXISTS photo_back text,
  ADD COLUMN IF NOT EXISTS photo_side text;

ALTER TABLE IF EXISTS public.program_catalog
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS intake_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS feedback_form_type text NOT NULL DEFAULT 'weekly';

INSERT INTO public.feedback_form_templates (name, cadence, fields, active)
VALUES
  (
    'Weekly Check-in',
    'weekly',
    '[
      {"id":"avg_weight","type":"number","label":"Average weight","unit":"kg"},
      {"id":"progress_photo","type":"image","label":"Progress photo"},
      {"id":"energy","type":"select","label":"Energy","options":["Low","OK","High"]},
      {"id":"one_struggle","type":"text","label":"One struggle"},
      {"id":"needed_changes","type":"text","label":"Needed changes"}
    ]'::jsonb,
    true
  ),
  (
    'End Program Review',
    'end',
    '[
      {"id":"final_photos","type":"image","label":"Final photos"},
      {"id":"best_result","type":"text","label":"Best result"},
      {"id":"hardest_part","type":"text","label":"Hardest part"},
      {"id":"testimonial","type":"text","label":"Testimonial"},
      {"id":"next_goal","type":"text","label":"Next goal"}
    ]'::jsonb,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  cadence = EXCLUDED.cadence,
  fields = EXCLUDED.fields,
  active = EXCLUDED.active,
  updated_at = now();
