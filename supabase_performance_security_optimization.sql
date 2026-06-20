-- Project Peak Telegram-only performance/security optimization
-- Run in Supabase Dashboard -> SQL Editor.
-- All statements are idempotent and safe to rerun.

-- Fast Telegram account lookup and Mini App access checks.
CREATE INDEX IF NOT EXISTS profiles_telegram_id_idx
  ON public.profiles (telegram_id)
  WHERE telegram_id IS NOT NULL AND telegram_id <> '';

CREATE INDEX IF NOT EXISTS profiles_role_idx
  ON public.profiles (role);

CREATE INDEX IF NOT EXISTS program_registrations_telegram_status_created_idx
  ON public.program_registrations (telegram_id, status, created_at DESC)
  WHERE telegram_id IS NOT NULL AND telegram_id <> '';

CREATE INDEX IF NOT EXISTS program_registrations_telegram_payment_created_idx
  ON public.program_registrations (telegram_id, payment_status, created_at DESC)
  WHERE telegram_id IS NOT NULL AND telegram_id <> '';

CREATE INDEX IF NOT EXISTS program_registrations_status_created_idx
  ON public.program_registrations (status, created_at DESC);

CREATE INDEX IF NOT EXISTS program_registrations_payment_created_idx
  ON public.program_registrations (payment_status, created_at DESC);

CREATE INDEX IF NOT EXISTS program_registrations_user_created_idx
  ON public.program_registrations (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Admin lists and user dashboards.
CREATE INDEX IF NOT EXISTS programs_user_id_idx
  ON public.programs (user_id);

CREATE INDEX IF NOT EXISTS daily_trackers_user_date_desc_idx
  ON public.daily_trackers (user_id, date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS daily_trackers_user_date_unique_idx
  ON public.daily_trackers (user_id, date);

CREATE INDEX IF NOT EXISTS weekly_checkins_user_week_desc_idx
  ON public.weekly_checkins (user_id, week_number DESC);

CREATE UNIQUE INDEX IF NOT EXISTS weekly_checkins_user_week_unique_idx
  ON public.weekly_checkins (user_id, week_number);

CREATE INDEX IF NOT EXISTS weekly_checkins_created_desc_idx
  ON public.weekly_checkins (created_at DESC);

CREATE INDEX IF NOT EXISTS weekly_schedule_user_day_idx
  ON public.weekly_schedule (user_id, day_of_week);

CREATE INDEX IF NOT EXISTS workouts_user_date_idx
  ON public.workouts (user_id, date);

CREATE INDEX IF NOT EXISTS workout_exercises_workout_id_idx
  ON public.workout_exercises (workout_id, id);

CREATE INDEX IF NOT EXISTS exercise_library_program_split_sort_idx
  ON public.exercise_library (program_type, split_name, sort_order);

CREATE INDEX IF NOT EXISTS exercise_swaps_user_original_idx
  ON public.exercise_swaps (user_id, original_exercise_id);

CREATE INDEX IF NOT EXISTS nutrition_items_program_meal_sort_idx
  ON public.nutrition_items (program_type, meal_type, sort_order);

CREATE INDEX IF NOT EXISTS nutrition_logs_user_date_completed_idx
  ON public.nutrition_logs (user_id, date, completed);

CREATE UNIQUE INDEX IF NOT EXISTS journaling_user_date_unique_idx
  ON public.journaling (user_id, date);

CREATE INDEX IF NOT EXISTS admin_notifications_read_created_idx
  ON public.admin_notifications (read, created_at DESC);

CREATE INDEX IF NOT EXISTS user_devices_user_seen_idx
  ON public.user_devices (user_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS program_catalog_active_key_idx
  ON public.program_catalog (active, program_key);

-- Keep payment uploads constrained to expected image types.
UPDATE storage.buckets
SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
WHERE id = 'registrations';

-- Optional protection if you set TELEGRAM_WEBHOOK_SECRET in Vercel and
-- register the webhook with Telegram's secret_token parameter:
-- https://api.telegram.org/bot<token>/setWebhook?url=<url>&secret_token=<secret>
