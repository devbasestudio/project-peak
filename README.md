# Project Peak

Production bilingual (Myanmar/English) 12-week home-workout platform. It includes the public GSAP landing experience, Supabase authentication, manual KPay purchase approval, a 48-session member program, offline-first workout/habit logging, progress and completion flows, and an admin template studio.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- GSAP + ScrollTrigger and Lenis on the public landing page
- Supabase Auth, Postgres, RLS, RPCs, and Storage
- Vercel production deployment

## Local setup

Copy `.env.example` to `.env.local` and provide:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_BOOTSTRAP_SECRET=
```

Then run:

```bash
npm install
npm run dev
```

Production checks:

```bash
npm run lint
npm run build
```

## Main routes

- `/mm` and `/en` — bilingual landing pages
- `/mm/login` and `/en/login` — Google, email magic-link, and owner password access
- `/{locale}/app` — customer program
- `/{locale}/admin` — protected admin dashboard
- `/{locale}/admin/templates` — bilingual Notion-style template editor
- `/api/health` — deployment health check

## Supabase

The production schema is in `supabase/migrations/202608300001_project_peak.sql`. It contains RLS for every public table, storage policies, the default 48-session template, deep-copy program assignment, and atomic progression/quiz RPCs. See `supabase/README.md` for the data model and deployment notes.

Google OAuth uses Supabase as the callback broker:

- Google JavaScript origin (local): `http://localhost:3000`
- Google JavaScript origin (production): `https://project-peak.vercel.app`
- Google redirect URI: `https://gzcostlnfwuvtihuzice.supabase.co/auth/v1/callback`
- App callback allowlist: `http://localhost:3000/auth/callback`, `https://project-peak.vercel.app/auth/callback`

Never expose the management PAT or service-role key in client code or source control.
