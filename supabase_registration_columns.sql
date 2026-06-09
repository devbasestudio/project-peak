-- Project Peak registration table columns
-- Run this in Supabase Dashboard -> SQL Editor if payment submit says:
-- "Could not find the 'program_name' column of 'program_registrations'".

ALTER TABLE IF EXISTS public.program_registrations
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS height text,
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS telegram_id text,
  ADD COLUMN IF NOT EXISTS workout_split text,
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
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS program_registrations_telegram_id_idx
  ON public.program_registrations (telegram_id);

CREATE INDEX IF NOT EXISTS program_registrations_status_idx
  ON public.program_registrations (status);

CREATE INDEX IF NOT EXISTS program_registrations_created_at_idx
  ON public.program_registrations (created_at DESC);
