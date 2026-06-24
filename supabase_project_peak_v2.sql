-- Project Peak v2 production workflow migration
-- Run in Supabase Dashboard -> SQL Editor after the existing project schema.

-- Existing registration queue: extend instead of replacing data.
ALTER TABLE IF EXISTS public.program_registrations
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS height text,
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS telegram_id text,
  ADD COLUMN IF NOT EXISTS workout_split text,
  ADD COLUMN IF NOT EXISTS program_key text,
  ADD COLUMN IF NOT EXISTS program_name text,
  ADD COLUMN IF NOT EXISTS duration_months integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS program_price integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS photo_front text,
  ADD COLUMN IF NOT EXISTS photo_back text,
  ADD COLUMN IF NOT EXISTS photo_side text,
  ADD COLUMN IF NOT EXISTS payment_screenshot text,
  ADD COLUMN IF NOT EXISTS intake_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS program_registrations_telegram_id_idx
  ON public.program_registrations (telegram_id);

CREATE INDEX IF NOT EXISTS program_registrations_status_idx
  ON public.program_registrations (status);

-- Optional profile shortcut for Telegram-aware admin screens.
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS telegram_id text;

ALTER TABLE IF EXISTS public.program_catalog
  ADD COLUMN IF NOT EXISTS feedback_form_type text NOT NULL DEFAULT 'weekly';

-- Program catalog edited by admin.
CREATE TABLE IF NOT EXISTS public.program_catalog (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  program_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text,
  accent text,
  durations jsonb NOT NULL DEFAULT '[]'::jsonb,
  intake_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  feedback_form_type text NOT NULL DEFAULT 'weekly',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Per-user custom daily tracker template.
CREATE TABLE IF NOT EXISTS public.custom_tracker_templates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT custom_tracker_templates_user_id_key UNIQUE (user_id)
);

-- Admin-created feedback form templates.
CREATE TABLE IF NOT EXISTS public.feedback_form_templates (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  cadence text NOT NULL DEFAULT 'weekly',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Broadcast/audit queue for weekly/end feedback requests.
CREATE TABLE IF NOT EXISTS public.feedback_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  program_name text NOT NULL,
  template_name text NOT NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Website-side notification feed for admin.
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Device restriction: each paid user can keep only two active device ids.
CREATE TABLE IF NOT EXISTS public.user_devices (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_devices_user_device_key UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS user_devices_user_id_idx
  ON public.user_devices (user_id);

-- More expressive compact daily tracker values.
ALTER TABLE IF EXISTS public.daily_trackers
  ADD COLUMN IF NOT EXISTS phone_off_time text,
  ADD COLUMN IF NOT EXISTS water_liters numeric(4,1),
  ADD COLUMN IF NOT EXISTS one_win text,
  ADD COLUMN IF NOT EXISTS one_struggle text;

ALTER TABLE public.program_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_tracker_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Packages are intentionally not seeded here.
-- Create the live package catalog from Admin -> Programs.

INSERT INTO public.feedback_form_templates (name, cadence, fields, active)
VALUES
  (
    'Weekly Check-in',
    'weekly',
    '[{"type":"number","label":"Average weight"},{"type":"image","label":"Progress photo"},{"type":"select","label":"Energy","options":["Low","OK","High"]},{"type":"text","label":"One struggle"},{"type":"text","label":"Needed changes"}]'::jsonb,
    true
  ),
  (
    'End Program Review',
    'end',
    '[{"type":"image","label":"Final photos"},{"type":"text","label":"Best result"},{"type":"text","label":"Hardest part"},{"type":"text","label":"Testimonial"},{"type":"text","label":"Next goal"}]'::jsonb,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  cadence = EXCLUDED.cadence,
  fields = EXCLUDED.fields,
  active = EXCLUDED.active,
  updated_at = now();

-- App reads/writes these tables through the service-role server client.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY in client components.
