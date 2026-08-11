# Project Peak Testing Guide

ဒီ file က Project Peak ကို local မှာစမ်းတဲ့အခါ ဘာတွေကို ဘယ်လိုစမ်းရမလဲဆိုတဲ့ checklist ပါ။ Project က Telegram Mini App first ဖြစ်တဲ့အတွက် real flow ကို Telegram bot chat + Telegram Mini App ကနေစမ်းတာကို အဓိကထားပါ။

## 1. Local Setup Check

Repo ကိုနောက်ဆုံး code ရအောင်ယူပါ။

```bash
git pull
npm install
cp .env.example .env
```

`.env` ထဲမှာ အောက်က value တွေဖြည့်ပါ။

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_IDS=
TELEGRAM_WEBHOOK_SECRET=
NEXT_PUBLIC_TELEGRAM_BOT_URL=
```

မှတ်ထားရန်:

- Local browser test အတွက် `NEXT_PUBLIC_APP_URL` ကို blank ထားလို့ရပါတယ်။
- Production/Vercel test အတွက် `NEXT_PUBLIC_APP_URL=https://project-peak-beta.vercel.app` ထားပါ။
- `TELEGRAM_ADMIN_IDS` ထဲမှာ admin Telegram ID တွေကို comma နဲ့ခွဲပြီးထည့်ပါ။ ဥပမာ `8319286644,5057037473`
- Real secret တွေကို Git ထဲမတင်ပါနဲ့။

Local server စပါ။

```bash
npm run dev
```

Browser မှာဖွင့်ပါ။

```text
http://localhost:3000
```

## 2. Supabase Setup Check

New database မှာ အစကနေစမ်းမယ်ဆိုရင် SQL files တွေကို Supabase Dashboard -> SQL Editor မှာ ဒီ order အတိုင်း run ပါ။

1. `supabase_project_peak_v2.sql`
2. `supabase_missing_tables.sql`
3. `supabase_storage_setup.sql`
4. `supabase_custom_tracker_values.sql`
5. `supabase_program_intake_seed.sql`
6. `supabase_performance_security_optimization.sql`

`supabase_registration_columns.sql` က repair script ပါ။ Registration/payment submit လုပ်တဲ့အခါ column missing error တက်မှ run ပါ။

Supabase ထဲမှာ စစ်ရမယ့် storage buckets:

- `registrations`
- `program-assets`

Supabase ထဲမှာ စစ်ရမယ့် main tables:

- `profiles`
- `program_templates`
- `program_registrations`
- `programs`
- `custom_tracker_templates`
- `daily_trackers`
- `weekly_checkins`
- `feedback_form_templates`
- `feedback_requests`
- `admin_notifications`

## 3. Telegram Bot Setup Check

Production test အတွက် webhook URL:

```text
https://project-peak-beta.vercel.app/api/telegram/webhook
```

Local Telegram test လုပ်ချင်ရင် localhost ကို HTTPS tunnel နဲ့ဖွင့်ပြီး webhook ကို tunnel URL ပေးပါ။

```text
https://<your-tunnel-domain>/api/telegram/webhook
```

Webhook set လုပ်ရန်:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://<domain>/api/telegram/webhook"
```

Bot command menu ပေါ်အောင် set လုပ်ရန်:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{"commands":[{"command":"start","description":"Project Peak စမယ်"},{"command":"packages","description":"Package ကြည့်မယ်"},{"command":"check_payment","description":"Payment status စစ်မယ်"},{"command":"help","description":"Command list"}]}'
```

Telegram ထဲမှာ `/` ရိုက်ရင် command list ပေါ်ရပါမယ်။

## 4. Test Accounts

အနည်းဆုံး account ၂ ခုနဲ့စမ်းပါ။

- Admin account: `TELEGRAM_ADMIN_IDS` ထဲမှာပါတဲ့ Telegram user
- Normal user account: `TELEGRAM_ADMIN_IDS` ထဲမှာမပါတဲ့ Telegram user

Admin account နဲ့ user account ကိုမရောပါနဲ့။ Admin နဲ့စမ်းတာတွေက `/admin/dashboard` ကိုရောက်ရပြီး normal user က approved/ready မဖြစ်ခင် Mini App dashboard မဝင်ရပါဘူး။

## 5. Admin Flow Test

Admin Telegram account နဲ့ Mini App ကိုဖွင့်ပါ။

Expected:

- Admin dashboard တန်းဝင်ရပါမယ်။
- Login page ကိုပြန်မရောက်ရပါဘူး။
- Mini App gate screen မပေါ်ရပါဘူး။

Admin overview:

1. Overview page ကိုဖွင့်ပါ။
2. Stats တွေက database real data နဲ့တက်လာရပါမယ်။
3. Reload button နှိပ်ရင် page data ပြန် refresh ဖြစ်ရပါမယ်။
4. Empty state ဖြစ်ရင် sample/fake data မပြရပါဘူး။

Programs:

1. Admin -> Programs ကိုသွားပါ။
2. Program အသစ် create လုပ်ပါ။
3. Program name, description, image upload, pricing tiers ထည့်ပါ။
4. Save နှိပ်ပါ။
5. `/packages` ကို Telegram bot မှာနှိပ်ပြီး program အသစ်ပေါ်မပေါ်စစ်ပါ။
6. Detail နှိပ်ရင် image, description, price, note တွေဖတ်လို့အဆင်ပြေရပါမယ်။
7. Code ထဲမှာ hardcoded sample packages မပေါ်ရပါဘူး။

Payments:

1. User က payment screenshot တင်ပြီးနောက် Admin -> Payments ကိုဖွင့်ပါ။
2. Pending payment ပေါ်ရပါမယ်။
3. Receipt ကိုနှိပ်ရင် app ထဲမှာ image preview/modal ပွင့်ရပါမယ်။
4. Approve button အလုပ်လုပ်ရပါမယ်။
5. Reject button အလုပ်လုပ်ရပါမယ်။
6. Reject လုပ်တာက user data/tracker data မဖျက်ရပါဘူး။

Clients:

1. Admin -> Clients ကိုဖွင့်ပါ။
2. Real client list ပေါ်ရပါမယ်။
3. Client detail ကိုဖွင့်ပါ။
4. User ဖြည့်ထားတဲ့ client info တွေမြင်ရပါမယ်။
5. Email မလိုတဲ့ flow မှာ generated email ကို customer-facing data အဖြစ်မပြရပါဘူး။
6. Body photos က front/back/side သုံးပုံပဲ logical ပေါ်ရပါမယ်။ Duplicate labels မပေါ်ရပါဘူး။
7. Daily logs tab မှာ user daily tracker ဖြည့်ထားတာတွေမြင်ရပါမယ်။
8. Feedback/check-in data တွေရှိရင်မြင်ရပါမယ်။

Trackers:

1. Admin -> Trackers ကိုဖွင့်ပါ။
2. Existing tracker fields တွေ edit/save လုပ်ပါ။
3. Add field နှိပ်ပြီး custom field ထည့်ပါ။
4. Field type ကို text/number/time/select/checkbox/counter/photo/workout ထဲကရွေးပါ။
5. Icon ကို dropdown ကနေ icon preview နဲ့ရွေးနိုင်ရပါမယ်။
6. Save ပြီး Send ready link နှိပ်ပါ။
7. Send ready link ကို ဒုတိယအကြိမ်ထပ်နှိပ်လည်း existing user tracker data မပျက်ရပါဘူး။
8. User Mini App ထဲမှာ admin ထည့်ထားတဲ့ field အသစ်ပါလာရပါမယ်။

Feedback:

1. Admin -> Feedback ကိုဖွင့်ပါ။
2. Weekly feedback template create/edit/save လုပ်ပါ။
3. End feedback template create/edit/save လုပ်ပါ။
4. Broadcast ကို package အလိုက်ပို့လို့ရပါမယ်။
5. Broadcast ကို all clients အတွက်ပို့လို့ရပါမယ်။
6. User ဘက်မှာ broken page မသွားရပါဘူး။

## 6. User Telegram Bot Flow Test

Normal user account နဲ့ Telegram bot မှာစမ်းပါ။

`/start`:

Expected:

- Welcome message မြန်မာလို ရင်းရင်းနှီးနှီးပေါ်ရပါမယ်။
- User Telegram ID ကိုပြရပါမယ်။
- Copy လုပ်နိုင်တဲ့ပုံစံ ဖြစ်ရပါမယ်။
- Database `profiles` ထဲမှာ Telegram user row တက်ရပါမယ်။

`/packages`:

Expected:

- Program list ကိုပဲ အရင်ပြရပါမယ်။
- Detail အရှည်ကြီးတွေ တန်းမပြရပါဘူး။
- Database ထဲက active programs တွေပဲပြရပါမယ်။
- Deleted programs/sample packages မပေါ်ရပါဘူး။

Package detail:

Expected:

- Program image ပေါ်ရပါမယ်။
- Description ပေါ်ရပါမယ်။
- Pricing tiers တွေ card/text design နဲ့ရှင်းရပါမယ်။
- Pricing note တွေ button ထဲမဟုတ်ဘဲ price detail text အနေနဲ့ဖတ်လို့ကောင်းရပါမယ်။

Payment:

1. Duration/price တစ်ခုရွေးပါ။
2. QR/payment instruction ပေါ်ရပါမယ်။
3. Payment screenshot ပို့ပါ။
4. Bot က upload received message ပြန်ပို့ရပါမယ်။
5. Admin Telegram ထဲကို payment screenshot image type နဲ့တန်းပို့ရပါမယ်။
6. Admin message ထဲမှာ approve/reject buttons ပါရပါမယ်။

`/check_payment`:

Expected state များ:

- Payment မတင်ရသေးရင် မတင်ရသေးကြောင်းပြရပါမယ်။
- Pending ဖြစ်ရင် စစ်ဆေးနေကြောင်းပြရပါမယ်။
- Approved ဖြစ်ရင် admin ready ပြင်နေကြောင်းပြရပါမယ်။
- Ready ဖြစ်ရင် Mini App ဖွင့်လို့ရကြောင်းပြရပါမယ်။
- Rejected ဖြစ်ရင် screenshot ပြန်တင်ခိုင်းရပါမယ်။

## 7. User Mini App Flow Test

Normal user ကို approve + ready လုပ်ပြီးနောက် Telegram Mini App ကိုဖွင့်ပါ။

Expected:

- Ready user က dashboard ကိုတန်းရောက်ရပါမယ်။
- Gate screen မှာပဲမထားရပါဘူး။
- Browser website login flow မဟုတ်ရပါဘူး။
- Header မှာ `Project Peak` နဲ့ current program name/week info dynamic ပေါ်ရပါမယ်။

Daily tracker:

1. Weight field မှာ manual type လုပ်လို့ရပါမယ်။
2. Counter buttons နှိပ်ရင် value တစ်ချက်ချင်းတိုး/လျော့နိုင်ရပါမယ်။
3. Steps, water, sleep, phone off, omega, win/struggle စတဲ့ fields တွေ save လုပ်လို့ရပါမယ်။
4. Photo field ရှိရင် image upload လုပ်လို့ရပါမယ်။
5. Save ပြီး UI feedback ချက်ချင်းမြင်ရပါမယ်။
6. Button နှိပ်ပြီးတာကို user မသိမသာဖြစ်မနေ loading/disabled/success state ပေါ်ရပါမယ်။
7. Supabase `daily_trackers` ထဲမှာ row တက်ရပါမယ်။
8. `tracker_values` JSON ထဲမှာ custom fields သိမ်းရပါမယ်။

Progress:

1. Progress tab ကိုဖွင့်ပါ။
2. Weight trend/recent logs တွေ data ရှိရင်ပေါ်ရပါမယ်။
3. Data မရှိရင် clean empty state ပေါ်ရပါမယ်။
4. Broken page မသွားရပါဘူး။

Feedback:

1. Feedback tab ကိုဖွင့်ပါ။
2. Weekly check-in button နှိပ်ရင် missing route မသွားရပါဘူး။
3. Admin က feedback form ပို့ထားရင် form ဖြည့်လို့ရပါမယ်။
4. Submit ပြီး admin ဘက်မှာမြင်ရပါမယ်။

Me/Profile:

1. Profile tab ကိုဖွင့်ပါ။
2. User ဖြည့်ထားတဲ့ info တွေအကုန်မြင်ရပါမယ်။
3. Edit profile ကိုနှိပ်ရင် page အပြောင်းအလဲမရှုပ်ဘဲ current profile area မှာပဲ edit လုပ်လို့ရပါမယ်။
4. Save ပြီး reload လုပ်လည်း data မပျက်ရပါဘူး။
5. Request device reset လိုမလို admin/user requirement နဲ့ကိုက်အောင်စစ်ပါ။ မလိုရင် UI ထဲမပေါ်ရပါဘူး။

Workout:

1. Mid-day workout field ထဲက Start ကိုနှိပ်ပါ။
2. Workout page သို့မဟုတ် workout section ပွင့်ရပါမယ်။
3. Admin က configured လုပ်ထားတဲ့ exercise တွေပဲပေါ်ရပါမယ်။
4. Upper push တစ်မျိုးပဲထည့်ထားရင် exercise ၄ ခု fake မပေါ်ရပါဘူး။
5. Workout template မရှိရင် “Workout မထည့်ရသေးပါ” ဆိုတဲ့ clean message ပေါ်ရပါမယ်။
6. Set table ရှိရင် kg/reps/set values သိမ်းလို့ရပါမယ်။

Daily streak:

1. Today daily tracker data ဖြည့်ပါ။
2. Streak count တိုးမတိုးစစ်ပါ။
3. မနေ့က data မရှိရင် streak reset logic မှန်မမှန်စစ်ပါ။
4. Reload လုပ်ပြီး streak value မပြောင်းသွားရပါဘူး။

## 8. Database Verification Queries

User row စစ်ရန်:

```sql
select id, telegram_id, telegram_username, role, created_at
from profiles
order by created_at desc
limit 20;
```

Program list စစ်ရန်:

```sql
select program_key, name, active, image_url, durations, intake_fields
from program_templates
order by created_at desc;
```

Payment status စစ်ရန်:

```sql
select id, telegram_id, program_name, payment_status, status, payment_screenshot_url, approved_at, ready_at
from program_registrations
order by created_at desc
limit 20;
```

Daily tracker data စစ်ရန်:

```sql
select user_id, date, body_weight, steps, tracker_values, updated_at
from daily_trackers
order by updated_at desc
limit 20;
```

Feedback/check-in စစ်ရန်:

```sql
select user_id, week_number, weight, notes, admin_feedback, created_at
from weekly_checkins
order by created_at desc
limit 20;
```

## 9. Regression Checklist

ဒီအချက်တွေက production မပို့ခင် မဖြစ်မနေစစ်ရမယ့်ဟာတွေပါ။

- Website checkout/package buy flow မသုံးတော့တာကြောင့် Telegram bot flow ပဲအလုပ်လုပ်ရပါမယ်။
- Hardcoded sample packages မပေါ်ရပါဘူး။
- Deleted package တွေ Telegram bot ထဲမှာမပေါ်ရပါဘူး။
- Admin ID ပါတဲ့ user က admin dashboard တန်းဝင်ရပါမယ်။
- Normal user က ready မဖြစ်ခင် dashboard မဝင်ရပါဘူး။
- Payment screenshot upload က Supabase storage ထဲတက်ရပါမယ်။
- Admin Telegram ကို payment image တန်းပို့ရပါမယ်။
- Reject လုပ်တာက client data မဖျက်ရပါဘူး။
- Send ready link ထပ်နှိပ်တာက tracker/program data မဖျက်ရပါဘူး။
- Admin add field လုပ်ပြီး save/ready လုပ်ရင် user dashboard မှာ field အသစ်ပေါ်ရပါမယ်။
- User ဖြည့်တဲ့ daily logs တွေ Admin -> Clients ထဲမှာမြင်ရပါမယ်။
- Progress/Feedback/Profile/Workout tabs တွေ broken route မသွားရပါဘူး။
- Image upload field တွေ URL paste မဟုတ်ဘဲ upload flow နဲ့အလုပ်လုပ်ရပါမယ်။
- Mobile Telegram Mini App viewport မှာ text overlap မဖြစ်ရပါဘူး။
- Button နှိပ်တာတွေမှာ loading/success/error state မြင်ရပါမယ်။

## 10. Performance Checks

Telegram bot response:

- `/start` response က 1-2 seconds အတွင်းပြန်လာသင့်ပါတယ်။
- `/packages` response က 1-2 seconds အတွင်းပြန်လာသင့်ပါတယ်။
- Payment screenshot upload ပြီး admin notification က 3-5 seconds အတွင်းရောက်သင့်ပါတယ်။

Mini App response:

- Mini App initial access check က 1-2 seconds အတွင်းပြီးသင့်ပါတယ်။
- Cache ရှိတဲ့ user က gate/loading screen ကြာကြာမနေရပါဘူး။
- Daily save action က 1-2 seconds အတွင်း success state ပြသင့်ပါတယ်။

Slow ဖြစ်ရင်စစ်ရန်:

- Vercel Function Logs
- Supabase Query Performance
- Supabase indexes from `supabase_performance_security_optimization.sql`
- Telegram webhook status
- Storage upload response time

## 11. Common Errors

CSS မပါသလိုဖြစ်ရင်:

- `npm run build` pass ဖြစ်မဖြစ်စစ်ပါ။
- Vercel latest deployment ဖြစ်မဖြစ်စစ်ပါ။
- Browser cache hard refresh လုပ်ပါ။

`The string did not match the expected pattern.`:

- Upload URL/path format စစ်ပါ။
- Supabase storage bucket ရှိမရှိစစ်ပါ။
- `SUPABASE_SERVICE_ROLE_KEY` env ဖြည့်ထားမထားစစ်ပါ။

Admin ဝင်မရရင်:

- Telegram ID ကိုမှန်အောင် `TELEGRAM_ADMIN_IDS` ထဲထည့်ထားမထားစစ်ပါ။
- Vercel env ပြောင်းပြီး redeploy လုပ်ပြီးပြီလားစစ်ပါ။
- Mini App ကို Telegram bot button ကနေဖွင့်ထားတာသေချာပါစေ။

Telegram bot message ကြာရင်:

- Webhook URL မှန်မမှန် `getWebhookInfo` နဲ့စစ်ပါ။
- Vercel logs မှာ error/timeout ရှိမရှိစစ်ပါ။
- Supabase project freeze/sleep ဖြစ်မဖြစ်စစ်ပါ။

Mini App က Telegram user ID မဖတ်နိုင်ရင်:

- Normal browser link ကနေမဟုတ်ဘဲ Telegram Mini App button ကနေဖွင့်ပါ။
- Bot token နဲ့ Mini App bot တူမတူစစ်ပါ။
- User က `/start` လုပ်ပြီးသားဖြစ်မဖြစ်စစ်ပါ။

## 12. Final Acceptance Test

Production ready လို့ယူနိုင်ဖို့ ဒီ full flow တစ်ကြိမ် pass ဖြစ်ရပါမယ်။

1. Admin creates a new program with image and 3 pricing tiers.
2. User presses `/start`.
3. User opens package list.
4. User views package detail.
5. User chooses package duration.
6. User uploads payment screenshot.
7. Admin receives image in Telegram.
8. Admin approves payment.
9. Admin updates tracker fields and sends ready link.
10. User opens Mini App and lands on dashboard directly.
11. User fills daily tracker, profile, photo, and feedback.
12. Admin sees user data in dashboard/client detail.
13. Progress and streak update correctly.
14. `npm run lint` passes.
15. `npm run build` passes.

