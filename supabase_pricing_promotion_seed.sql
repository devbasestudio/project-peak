-- Project Peak pricing cards + launch promotion seed
-- Safe to rerun in Supabase Dashboard -> SQL Editor.
--
-- This sets the current pricing cards to:
--   1 Month  - ¥980
--   1 Year   - ¥4,980, Launch Promotion ¥3,980 for first 100 members
--   Lifetime - ¥12,800
--
-- It updates every active program in program_catalog. If no program exists yet,
-- it creates one active "Project Peak" program.

WITH pricing AS (
  SELECT
    '[
      {
        "label": "1 Month",
        "months": 1,
        "price": 980,
        "currency": "¥",
        "note": ""
      },
      {
        "label": "1 Year",
        "months": 12,
        "price": 4980,
        "currency": "¥",
        "note": "Most Popular",
        "badge": "Most Popular",
        "originalPrice": 4980,
        "promoEnabled": true,
        "promoPrice": 3980,
        "promoLimit": 100,
        "promoTitle": "Launch Promotion",
        "promoDescription": "ပထမဆုံး Member အယောက် (၁၀၀) အတွက်သာ"
      },
      {
        "label": "Lifetime",
        "months": 999,
        "price": 12800,
        "currency": "¥",
        "note": ""
      }
    ]'::jsonb AS durations
),
updated AS (
  UPDATE public.program_catalog
  SET durations = pricing.durations,
      updated_at = now()
  FROM pricing
  WHERE active = true
  RETURNING id
)
INSERT INTO public.program_catalog (
  program_key,
  name,
  description,
  image_url,
  accent,
  durations,
  intake_fields,
  feedback_form_type,
  active
)
SELECT
  'project-peak',
  'Project Peak',
  'Telegram Mini App coaching program',
  '/img/hero_bg.jpg',
  '#ff6b35',
  pricing.durations,
  '[]'::jsonb,
  'weekly',
  true
FROM pricing
WHERE NOT EXISTS (SELECT 1 FROM updated)
  AND NOT EXISTS (SELECT 1 FROM public.program_catalog WHERE active = true);
