# Project Peak

Telegram Mini App first coaching system.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Required env:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_IDS=
NEXT_PUBLIC_TELEGRAM_BOT_URL=
```

`NEXT_PUBLIC_APP_URL` is optional. Leave it blank in local development so Telegram links use the current request origin.

## Telegram Flow

- Users start from the Telegram bot chat.
- `/start` creates/updates the Telegram user record and shows their Telegram ID.
- Package selection, QR payment, screenshot upload, and payment status checking happen in the bot chat.
- Admins receive payment screenshots in Telegram with approve/reject buttons.
- The Mini App is only for approved/ready members and admins.

## Supabase

Run these SQL files in Supabase when setting up a new project:

- `supabase_project_peak_v2.sql`
- `supabase_storage_setup.sql`
- `supabase_performance_security_optimization.sql`

The `registrations` storage bucket must exist for Telegram payment screenshots.

## Verification

```bash
npm run lint
npm run build
```

For real Telegram webhook testing, expose localhost with an HTTPS tunnel and set the bot webhook to:

```text
https://<your-tunnel>/api/telegram/webhook
```
