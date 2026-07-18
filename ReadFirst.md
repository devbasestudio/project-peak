# Read First - Project Peak

ဒီ project က Telegram Mini App first coaching system ပါ။ Website landing/login ကို အဓိကမသုံးတော့ဘဲ user flow အများစုက Telegram bot chat + Telegram Mini App နဲ့သွားပါတယ်။

## Git Repo

```bash
git clone https://github.com/devbasestudio/project-peak.git
cd project-peak
```

Branch: `master`

Repo က private ဖြစ်နေရင် GitHub owner က clone လုပ်မယ့် account ကို access ပေးထားရပါမယ်။

## Tech Stack

- Next.js `16.2.6`
- React `19`
- Supabase Auth, Database, Storage
- Telegram Bot API + Telegram Mini App
- Vercel deploy

## Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Local URL:

```text
http://localhost:3000
```

Before handing off or deploying, verify:

```bash
npm run lint
npm run build
```

Current known lint warnings may exist in old files, but there should be no lint/build errors.

## Required Env

Fill these in `.env` locally and in Vercel Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_IDS=
NEXT_PUBLIC_TELEGRAM_BOT_URL=

# Optional locally. In production set this to the Vercel domain.
NEXT_PUBLIC_APP_URL=

# Optional. Only use if webhook gateway protection is added.
TELEGRAM_WEBHOOK_SECRET=
```

Notes:

- `TELEGRAM_ADMIN_IDS` is comma-separated Telegram user IDs, for example `8319286644,5057037473`.
- `NEXT_PUBLIC_TELEGRAM_BOT_URL` should be the bot link, for example `https://t.me/<bot_username>`.
- `NEXT_PUBLIC_APP_URL` should be production app URL on Vercel, for example `https://project-peak-beta.vercel.app`.
- Never commit real `.env` secrets.

## Supabase Setup

Create a Supabase project, then run these SQL files in Supabase Dashboard -> SQL Editor.

Recommended order:

1. `supabase_project_peak_v2.sql`
2. `supabase_missing_tables.sql`
3. `supabase_storage_setup.sql`
4. `supabase_custom_tracker_values.sql`
5. `supabase_program_intake_seed.sql`
6. `supabase_performance_security_optimization.sql`

`supabase_registration_columns.sql` is a repair script. Run it only if registration/payment submit says columns are missing.

Storage buckets created by SQL:

- `registrations` for payment screenshots, body photos, and tracker photos
- `program-assets` for admin-uploaded program/package images

## Telegram Bot Setup

Bot webhook should point to:

```text
https://<production-domain>/api/telegram/webhook
```

For local Telegram testing, expose localhost with an HTTPS tunnel and set webhook to:

```text
https://<your-tunnel>/api/telegram/webhook
```

Useful bot commands:

```text
/start - main menu and Telegram ID registration
/packages - package list
/check_payment - payment status check
/help - command list
```

Telegram flow:

1. User opens bot and presses `/start`.
2. Bot creates/updates Telegram user record and shows Telegram ID.
3. User chooses package in bot chat.
4. User uploads payment screenshot in bot chat.
5. Admin receives screenshot in Telegram with approve/reject buttons.
6. After approval, admin sends ready access.
7. User opens Telegram Mini App and lands in the tracker/dashboard.

## Admin Flow

Admins are identified by `TELEGRAM_ADMIN_IDS`.

Admin Mini App should route admins to:

```text
/admin/dashboard
```

Admin should create packages from:

```text
Admin -> Programs
```

Important: package/program data should come from the database, not hardcoded code.

Admin should create/edit client tracker fields from:

```text
Admin -> Trackers
```

Admin can review client daily filled data from:

```text
Admin -> Clients -> Open Client -> Daily logs
```

## User Flow

Users should normally enter through Telegram Mini App after approval.

Main user app:

```text
/user/dashboard
```

User dashboard tabs:

- Logs: daily tracker fields
- Progress: recent daily logs and weight trend
- Feedback: feedback request placeholder until admin sends a feedback form
- Me: profile/client info, body photos, inline profile editing

Workout behavior:

- Dashboard Start opens `/user/workout?split=<split-name>`.
- Workout exercises come from `exercise_library`.
- If admin has not created exercise templates for that split, user sees a clear “Workout မထည့်ရသေးပါ” message.
- The app should not auto-create fake fallback exercises.

## Deployment Checklist

1. Push latest `master` to GitHub.
2. Connect repo to Vercel.
3. Add all env variables in Vercel.
4. Run all required Supabase SQL files.
5. Confirm storage buckets exist.
6. Set Telegram bot webhook to production `/api/telegram/webhook`.
7. Add bot menu commands in BotFather or Telegram API.
8. Test with one admin Telegram ID and one normal user Telegram ID.

## Test Checklist

Admin:

1. Open Telegram Mini App with admin Telegram account.
2. Confirm admin dashboard opens.
3. Create a program/package with image upload.
4. Check `/packages` in Telegram bot and confirm package list shows only DB packages.
5. Approve/reject payment from Telegram admin message.
6. Open Admin -> Clients -> client detail and confirm client info, daily logs, and check-ins show real data.

User:

1. Press `/start` in Telegram bot.
2. Confirm bot shows Telegram ID.
3. Open `/packages`.
4. Choose package duration.
5. Upload payment screenshot.
6. After admin approval/ready, open Mini App.
7. Confirm dashboard opens directly, not a gate screen.
8. Fill daily logs and confirm saving feedback appears quickly.
9. Open Progress tab and confirm recent daily logs show.
10. Open Me tab and edit profile inline.
11. Press workout Start and confirm only real configured exercises show.

## Common Problems

If Telegram bot is slow:

- Check Vercel function logs.
- Check Supabase response time.
- Confirm `TELEGRAM_BOT_TOKEN` is correct.
- Confirm webhook URL is production HTTPS.

If Mini App cannot identify user:

- Open from Telegram Mini App button, not normal browser.
- Confirm bot token matches the Mini App bot.
- Confirm user pressed `/start` first.

If admin cannot enter dashboard:

- Confirm their Telegram ID is included in `TELEGRAM_ADMIN_IDS`.
- Confirm env was updated in Vercel and deployment was redeployed.

If image upload fails:

- Confirm `registrations` and `program-assets` buckets exist.
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is present in env.

## Important Rules For Future Development

- Do not add sample packages in code.
- Do not hardcode package/program names in UI.
- Do not route users to old unused pages unless the page is intentionally revived.
- Keep Telegram user ID as the primary user identity.
- Keep admin-generated tracker/program data database-driven.
- Run `npm run lint` and `npm run build` before pushing.
