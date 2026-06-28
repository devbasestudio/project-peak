-- Custom daily tracker values for admin-created fields.
-- Run in Supabase Dashboard -> SQL Editor.

ALTER TABLE IF EXISTS public.daily_trackers
  ADD COLUMN IF NOT EXISTS tracker_values jsonb NOT NULL DEFAULT '{}'::jsonb;
