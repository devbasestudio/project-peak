-- Project Peak program intake seed
-- Run in Supabase Dashboard -> SQL Editor.
-- This is safe to rerun. It seeds the questions the bot should ask after
-- a payment screenshot is submitted.

ALTER TABLE IF EXISTS public.program_registrations
  ADD COLUMN IF NOT EXISTS program_key text,
  ADD COLUMN IF NOT EXISTS intake_answers jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.program_catalog
  ADD COLUMN IF NOT EXISTS feedback_form_type text NOT NULL DEFAULT 'weekly';

UPDATE public.program_registrations
SET program_key = CASE
  WHEN lower(coalesce(program_name, '')) LIKE '%project-20%' THEN 'project20'
  WHEN lower(coalesce(program_name, '')) LIKE '%mass%' THEN 'mass'
  WHEN lower(coalesce(program_name, '')) LIKE '%recomp%' THEN 'recomp'
  ELSE program_key
END
WHERE program_key IS NULL OR program_key = '';

UPDATE public.program_catalog
SET
  intake_fields = '[
    {"id":"weight","label":"Weight","type":"number","required":true,"unit":"kg","prompt":"လက်ရှိ ကိုယ်အလေးချိန် ဘယ်လောက်ရှိပါသလဲ? kg နဲ့ရေးပေးပါ။"},
    {"id":"height","label":"Height","type":"text","required":true,"prompt":"အရပ် ဘယ်လောက်ရှိပါသလဲ? ဥပမာ 5ft 8in / 173cm"},
    {"id":"age","label":"Age","type":"number","required":true,"unit":"years","prompt":"အသက် ဘယ်လောက်ရှိပါသလဲ?"},
    {"id":"photo_front","label":"Front body photo","type":"photo","required":true,"photoSlot":"front","prompt":"ရှေ့ဘက် body photo တစ်ပုံ ပို့ပေးပါ။"},
    {"id":"photo_back","label":"Back body photo","type":"photo","required":true,"photoSlot":"back","prompt":"နောက်ဘက် body photo တစ်ပုံ ပို့ပေးပါ။"},
    {"id":"photo_side","label":"Side body photo","type":"photo","required":true,"photoSlot":"side","prompt":"ဘေးဘက် body photo တစ်ပုံ ပို့ပေးပါ။"},
    {"id":"goal_notes","label":"Goal / notes","type":"text","required":false,"prompt":"ဒီ program မှာ အဓိကဖြစ်ချင်တဲ့ goal ကိုရေးပေးပါ။"}
  ]'::jsonb,
  feedback_form_type = 'weekly',
  updated_at = now()
WHERE program_key IN ('recomp', 'project20');

UPDATE public.program_catalog
SET
  intake_fields = '[
    {"id":"weight","label":"Weight","type":"number","required":true,"unit":"kg","prompt":"လက်ရှိ ကိုယ်အလေးချိန် ဘယ်လောက်ရှိပါသလဲ? kg နဲ့ရေးပေးပါ။"},
    {"id":"height","label":"Height","type":"text","required":true,"prompt":"အရပ် ဘယ်လောက်ရှိပါသလဲ? ဥပမာ 5ft 8in / 173cm"},
    {"id":"age","label":"Age","type":"number","required":true,"unit":"years","prompt":"အသက် ဘယ်လောက်ရှိပါသလဲ?"},
    {"id":"photo_front","label":"Front body photo","type":"photo","required":true,"photoSlot":"front","prompt":"ရှေ့ဘက် body photo တစ်ပုံ ပို့ပေးပါ။"},
    {"id":"photo_back","label":"Back body photo","type":"photo","required":true,"photoSlot":"back","prompt":"နောက်ဘက် body photo တစ်ပုံ ပို့ပေးပါ။"},
    {"id":"photo_side","label":"Side body photo","type":"photo","required":true,"photoSlot":"side","prompt":"ဘေးဘက် body photo တစ်ပုံ ပို့ပေးပါ။"},
    {"id":"goal_notes","label":"Goal / notes","type":"text","required":false,"prompt":"Muscle gain အတွက် အဓိက goal ကိုရေးပေးပါ။"}
  ]'::jsonb,
  feedback_form_type = 'end_of_program',
  updated_at = now()
WHERE program_key = 'mass';

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
