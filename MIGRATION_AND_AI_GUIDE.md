# Project Peak: Supabase, Google Login & AI Collaboration Guide

မင်္ဂလာပါ! ဤလမ်းညွှန်ချက်သည် **Project Peak** အား MySQL မှ **Supabase (PostgreSQL)** သို့ ကူးပြောင်းခြင်း၊ **Google OAuth (Google Login)** ထည့်သွင်းခြင်း၊ **Vercel** တွင် Deploy တင်ခြင်းနှင့် **AI Coding Agent** များနှင့်အတူ လက်တွဲပြီး ဤ codebase ကို ထပ်မံတိုးချဲ့တည်ဆောက်ပုံတို့ကို လေ့လာရန်အတွက် ရေးသားထားသော လက်စွဲစာအုပ်ဖြစ်ပါသည်။

---

## 🔗 Project GitHub Repository
ပရောဂျက်အား စမ်းသပ်ရန်နှင့် clone လုပ်ရန်အတွက် သင့်ဆရာ (Mentor) တင်ပေးထားသော တရားဝင် Repository URL ဖြစ်သည်-
* **Repository Link:** [https://github.com/devbasestudio/project-peak](https://github.com/devbasestudio/project-peak)
* **Clone Command:**
  ```bash
  git clone https://github.com/devbasestudio/project-peak.git
  ```

---

## 📋 Task List & Setup Instructions (လုပ်ဆောင်ရန် လုပ်ငန်းစဉ်များ)

---

### Task 1: Supabase Key (၃) ခု ရှာဖွေရယူနည်း
ပရောဂျက်အား Local တွင်ဖြစ်စေ၊ Vercel ပေါ်တွင်ဖြစ်စေ အလုပ်လုပ်နိုင်ရန် အောက်ပါ API Keys ၃ ခု လိုအပ်သည်။

1. [Supabase Dashboard](https://supabase.com) သို့ သွားပြီး သင့် Project ကို နှိပ်ပါ။
2. ဘယ်ဘက်အောက်ခြေရှိ **Settings** (စက်ဝိုင်းပုံစံ Cog icon) -> **API** သို့ သွားပါ။
3. ထိုနေရာတွင် အောက်ပါ Keys များကို ကူးယူပါ-
   * **`NEXT_PUBLIC_SUPABASE_URL`:** Project URL (ဥပမာ- `https://xxx.supabase.co`)
   * **`NEXT_PUBLIC_SUPABASE_ANON_KEY`:** `anon` `public` ဟု ရေးထားသော browser-safe key ဖြစ်သည်။
   * **`SUPABASE_SERVICE_ROLE_KEY`:** `service_role` ဟု ရေးထားသော လျှို့ဝှက် key ဖြစ်သည်။ *(⚠️ သတိပြုရန်- ဤ key ကို absolute admin actions များဖြစ်သော onboarding user seeding များအတွက်သာ Backend တွင် သုံးပြီး client-side တွင် ဘယ်တော့မှ မဖော်ပြရပါ)*

---

### Task 2: Supabase SQL Setup (Tables & Triggers)
Supabase SQL Editor တွင် Run ရမည့် schema script များကို project setup လုပ်ရန် ရေးသားရပါမည်။
1. Supabase Dashboard ၏ **SQL Editor** သို့ သွားပါ။
2. **New Query** ဖွင့်ပြီး `profiles`, `programs`, `daily_trackers`, `workouts` စသည့် ဇယားများ ဖန်တီးပေးရမည်။
3. **အထူးအရေးကြီးသည့် အချက်မှာ-** User အသစ်တစ်ယောက် Supabase Auth တွင် Register လုပ်လိုက်သည်နှင့် `public.profiles` table ထဲသို့ အလိုအလျောက် သွားရောက်ထည့်သွင်းပေးမည့် trigger function ကို ထည့်သွင်းပေးရန်ဖြစ်သည်-
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, username, email, role, onboarding_complete)
     VALUES (
       new.id,
       COALESCE(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', 'User'),
       new.email,
       'user',
       false
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

---

### Task 3: Google Login (OAuth) Setup လုပ်နည်း
Google ဖြင့် Login ဝင်ရောက်နိုင်ရန် Google Cloud Console နှင့် Supabase တို့ကို ချိတ်ဆက်ပေးရပါမည်။

#### 3.1 Google Cloud Console တွင် ပြင်ဆင်ရန်
1. [Google Cloud Console](https://console.cloud.google.com) သို့ သွားပြီး Project တစ်ခု ဆောက်ပါ။
2. **APIs & Services -> OAuth consent screen** တွင် configuration များကို ဖြည့်ပါ။
3. **Credentials -> Create Credentials -> OAuth client ID** ကို ရွေးပြီး Application type အား **Web application** ရွေးချယ်ပါ။
4. **Authorized JavaScript origins** တွင် သင့် Vercel Link ကို ထည့်ပါ-
   `https://project-peak-fitness.vercel.app`
5. **Authorized redirect URIs** တွင် သင့် Supabase Redirect URL အား ထည့်ပါ:
   `https://rsmrnpasopradykqpsyl.supabase.co/auth/v1/callback`
6. ပြီးပါက ရရှိလာသော **Client ID** နှင့် **Client Secret** ကို သိမ်းထားပါ။

#### 3.2 Supabase Dashboard တွင် ထည့်သွင်းရန်
1. Supabase Dashboard ၏ **Auth -> Providers -> Google** သို့ သွားပြီး Enable လုပ်ပါ။
2. Google Cloud မှ ရလာသော **Client ID** နှင့် **Client Secret** တို့ကို ထည့်သွင်းပြီး Save နှိပ်ပါ။

---

### Task 4: Vercel Deploy & Post-Deploy Setup
Next.js app ကို Vercel ပေါ်တင်ပြီး လိပ်စာများအား ချိန်ညှိရန် ဖြစ်သည်။

1. [Vercel](https://vercel.com) တွင် GitHub project `project-peak` အား Import လုပ်ပါ။
2. Environment Variables ထဲတွင် Task 1 မှ ရရှိခဲ့သော Keys ၃ ခုလုံးကို တိကျစွာ ထည့်သွင်းပြီး **Deploy** လုပ်ပါ။
3. **Redirect URL များ ချိန်ညှိခြင်း (⚠️ အရေးကြီးသည်):**
   Supabase Dashboard ၏ **Auth -> URL Configuration** သို့ သွားပါ။
   * **Site URL** ကို `https://project-peak-fitness.vercel.app` ပြောင်းလဲပါ။
   * **Redirect URLs** စာရင်းထဲတွင် အောက်ပါတို့ကို ထည့်ပေးပါ-
     * `https://project-peak-fitness.vercel.app/api/auth/callback`
     * `https://project-peak-fitness.vercel.app/**`

---

## 🤖 How to Collaborate with an AI Coding Agent (AI နှင့် လက်တွဲလုပ်ဆောင်နည်း)

ဤပရောဂျက်သည် Next.js 16 (App Router) နှင့် Supabase Server-side rendering (SSR cookies) တို့ကို အသုံးပြုထားသော ခေတ်မီ Premium Web App တစ်ခု ဖြစ်သည်။ AI Agent (ဥပမာ- Cursor, Copilot, သို့မဟုတ် Antigravity) တို့နှင့် လက်တွဲ၍ တိုးချဲ့တည်ဆောက်ရာတွင် အောက်ပါအဆင့်များကို လိုက်နာပါ-

### 1. Context အပြည့်အစုံပေးခြင်း (Providing Context)
AI ကို မေးခွန်းမေးသည့်အခါ သို့မဟုတ် feature အသစ် ရေးခိုင်းသည့်အခါ အောက်ပါအချက်များကို အရင်ရှင်းပြပါ-
* *"ဒါဟာ Next.js App Router project ဖြစ်ပြီး Supabase SSR client (`@supabase/ssr`) ကိုသုံးပြီး Session ကို Middleware မှာ cookies နဲ့ ထိန်းထားတယ်"*
* *"Database compatibility layer အဖြစ် query mappings တွေ သုံးထားတယ်"*

### 2. build compile error များကို ကြိုတင်ကာကွယ်ခြင်း
Next.js သည် build တင်ချိန်တွင် pages များကို static prerender စမ်းသပ်သဖြင့် API Keys မရှိပါက Crash ဖြစ်တတ်သည်။
ထို့ကြောင့် AI အား Supabase client တည်ဆောက်ခိုင်းလျှင် အောက်ပါအတိုင်း fallback values များ ထည့်သွင်းရေးသားခိုင်းပါ-
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );
}
```

### 3. API Routes ရေးသားခိုင်းပုံ
AI အား feature အသစ်များ (API Routes) ရေးခိုင်းလျှင် serverside client အား lazy initialization လုပ်ခိုင်းရန် အောက်ပါအတိုင်း ညွှန်ကြားပါ-
```typescript
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient(); // Function internal evaluation (Safe for build)
  // your db query logic
}
```

### 4. Build Test အမြဲတမ်း ပြုလုပ်ပါ
ကုဒ်များကို အပြောင်းအလဲလုပ်ပြီးတိုင်း local production environment တွင် build မထိခိုက်ကြောင်း သေချာစေရန် အမြဲစစ်ဆေးခိုင်းပါ-
```bash
npm run build
```

---
💡 **အကြံပြုချက်-** ဤလမ်းညွှန်ဖိုင် `MIGRATION_AND_AI_GUIDE.md` အား သင့်ရဲ့ AI chat prompt ထဲသို့ တိုက်ရိုက် attachment အနေဖြင့် ထည့်သွင်းပြီး မေးမြန်းပါက AI သည် ဤပရောဂျက်၏ သဘောသဘာဝကို အစကတည်းက သဘောပေါက်ပြီး ပြီးပြည့်စုံသော ကုဒ်များကို ထုတ်ပေးနိုင်လိမ့်မည် ဖြစ်သည်။
