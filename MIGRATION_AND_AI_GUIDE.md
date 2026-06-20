# Project Peak Telegram Mini App Guide

Project Peak is now Telegram Mini App only. Website checkout and public website login are disabled.

## Required Services

1. Supabase project
2. Telegram bot
3. HTTPS deployment or tunnel for Telegram webhook testing

## Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_IDS=1827344905,5057037473,8319286644
NEXT_PUBLIC_TELEGRAM_BOT_URL=https://t.me/<bot_username>
TELEGRAM_WEBHOOK_SECRET=
```

Leave `NEXT_PUBLIC_APP_URL` blank unless a deployment platform needs an explicit public URL. The app normally uses the incoming request origin.

## Database

Run:

1. `supabase_project_peak_v2.sql`
2. `supabase_storage_setup.sql`
3. `supabase_performance_security_optimization.sql`

## Bot Webhook

Set Telegram webhook to:

```text
https://<domain>/api/telegram/webhook
```

The bot handles:

- `/start`
- `/check-payment`
- package list
- package detail
- duration selection
- payment screenshot upload
- admin approve/reject callback buttons

## Mini App Access

- Admin Telegram IDs open the Mini App and are sent to `/admin/dashboard`.
- Normal users can open the app only after `payment_status = ready`.
- Login sessions are created through signed Mini App session links, not public website login.
