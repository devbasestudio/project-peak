# Project Peak: Supabase & AI Vibe Coding Guide 🚀⚡

ဟေ့! အဆင်သင့်ပဲလား? ဤလမ်းညွှန်ချက်သည် **Project Peak** ကို MySQL ကနေ **Supabase (PostgreSQL)** သို့ ပြောင်းလဲခြင်း၊ **Google Login** ထည့်သွင်းခြင်းနှင့် **Vercel** ပေါ်တင်ခြင်းတို့ကို **AI (vibe coding)** သုံးပြီး အေးဆေးအေးဆေး တူတူလုပ်ဆောင်နိုင်ဖို့ ရေးသားထားတဲ့ ပေါ့ပေါ့ပါးပါး လက်စွဲစာအုပ် ဖြစ်ပါတယ်။

ရိုးရိုး developer တွေလို အလုပ်ရှုပ်စရာ မလိုပါဘူး။ AI Agent (ဥပမာ- Cursor, Claude, Antigravity) တွေနဲ့ တူတူ Vibe Coding လုပ်ပြီး App ကို အလန်းစားဖြစ်အောင် ဘယ်လို ဆက်ဆောက်မလဲဆိုတာ လေ့လာလိုက်ရအောင်!

---

## 🔗 Project GitHub Repository
သင့်ဆရာ (Mentor) တင်ပေးထားတဲ့ Git Repository ဖြစ်ပါတယ်။ အောက်ပါ link ကနေ clone သို့မဟုတ် download ယူပါ-
* **Repository Link:** [https://github.com/devbasestudio/project-peak](https://github.com/devbasestudio/project-peak)
* **စတင်ရန် Clone Command:**
  ```bash
  git clone https://github.com/devbasestudio/project-peak.git
  ```

---

## 📋 Task List (လုပ်ဆောင်ရန် လွယ်ကူသော အဆင့်များ)

---

### Task 1: Supabase Key (၃) ခု အလွယ်တကူ ယူနည်း
Local မှာ စမ်းသပ်ဖို့နဲ့ Vercel ပေါ်တင်ဖို့ Supabase Keys ၃ ခု လိုအပ်ပါတယ်။

1. [Supabase Dashboard](https://supabase.com) သို့ သွားပြီး သင့် Project ထဲ ဝင်ပါ။
2. ဘယ်ဘက် Sidebar အောက်ခြေက **Settings** (စက်ဝိုင်းပုံစံ Cog icon) -> **API** သို့ သွားပါ။
3. အောက်ပါ Keys ၃ ခုကို Copy ယူပြီး `.env` ထဲ ထည့်ပါ-
   * **`NEXT_PUBLIC_SUPABASE_URL`:** Project Link လေးဖြစ်ပါတယ်။
   * **`NEXT_PUBLIC_SUPABASE_ANON_KEY`:** Browser မှာ သုံးဖို့ safe ဖြစ်တဲ့ public key ပါ။
   * **`SUPABASE_SERVICE_ROLE_KEY`:** Backend မှာ seeding (အကောင့်ဖွင့်ပေးခြင်း) တွေလုပ်ဖို့ သုံးတဲ့ လျှို့ဝှက် Admin key ဖြစ်ပါတယ်။ *(⚠️ သတိပြုရန်- ဤ key ကို AI အား frontend custom code တွေထဲ ဘယ်တော့မှ မထည့်ခိုင်းပါနဲ့)*

---

### Task 2: Supabase SQL Setup (Database tables တွေ စက္ကန့်ပိုင်းအတွင်း ဆောက်နည်း)
MySQL db setup တွေ အလုပ်ရှုပ်မခံပါနဲ့။ Supabase ရဲ့ SQL Editor မှာ Copy-paste လုပ်ပြီး Run လိုက်ရုံပါပဲ။
1. Supabase Dashboard ၏ **SQL Editor** သို့ သွားပါ။
2. **New Query** ဖွင့်ပြီး profiles, workouts စတဲ့ ဇယားများ ဖန်တီးပေးရပါမည်။
3. **Trigger Setup (အရေးကြီးဆုံး vibe):** User အသစ် register လုပ်တာနဲ့ Profiles table ထဲကို အလိုအလျောက် သွားရောက်ထည့်သွင်းပေးမယ့် Database Trigger ဖန်တီးရန် ဤ SQL ကုဒ်ကို run လိုက်ပါ-
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

### Task 3: Google Login Setup (Vibe coding ပုံစံ)
Google ဖြင့် Login ဝင်ရောက်နိုင်ရန် Google Cloud Console နှင့် Supabase တို့ကို ချိတ်ဆက်ပေးရပါမည်။

#### 3.1 Google Cloud Console တွင် ပြင်ဆင်ရန်
1. [Google Cloud Console](https://console.cloud.google.com) သို့ သွားပြီး Project တစ်ခု ဆောက်ပါ။
2. **APIs & Services -> Credentials -> Create Credentials -> OAuth client ID** ကို ရွေးပြီး Application type အား **Web application** ရွေးချယ်ပါ။
3. **Authorized JavaScript origins** တွင် သင့် Vercel Link ကို ထည့်ပါ-
   `https://project-peak-fitness.vercel.app`
4. **Authorized redirect URIs** တွင် သင့် Supabase Redirect URL အား ထည့်ပါ:
   `https://rsmrnpasopradykqpsyl.supabase.co/auth/v1/callback`
5. ပြီးပါက ရရှိလာသော **Client ID** နှင့် **Client Secret** ကို ကူးယူထားပါ။

#### 3.2 Supabase Dashboard တွင် ဖြည့်စွက်ရန်
1. Supabase Dashboard ၏ **Auth -> Providers -> Google** သို့ သွားပြီး Enable လုပ်ပါ။
2. ရလာသော **Client ID** နှင့် **Client Secret** တို့ကို ဖြည့်သွင်းပြီး Save နှိပ်ပါ။

---

### Task 4: Vercel Deploy & Post-Deploy Setup
သင့် App ကို live လွှင့်ပြီး လိပ်စာများ ညွှန်းပေးရန် ဖြစ်သည်။

1. [Vercel](https://vercel.com) တွင် GitHub project `project-peak` အား Import လုပ်ပါ။
2. Environment Variables ထဲတွင် Task 1 မှ ရရှိခဲ့သော Keys ၃ ခုလုံးကို တိကျစွာ ထည့်သွင်းပြီး **Deploy** လုပ်ပါ။
3. **Redirect URL များ ချိန်ညှိခြင်း (⚠️ အရေးကြီးသည်):**
   Supabase Dashboard ၏ **Auth -> URL Configuration** သို့ သွားပါ။
   * **Site URL** ကို `https://project-peak-fitness.vercel.app` ပြောင်းပါ။
   * **Redirect URLs** စာရင်းထဲတွင် အောက်ပါတို့ကို ထည့်ပေးပါ-
     * `https://project-peak-fitness.vercel.app/api/auth/callback`
     * `https://project-peak-fitness.vercel.app/**`

---

## 🤖 AI Vibe Coding Manual (AI ကို အမိန့်ပေးပြီး တူတူ vibe နည်း)

မင်းဟာ ကုဒ်တွေ အများကြီး ကိုယ်တိုင်လိုက်ရေးစရာ မလိုပါဘူး။ AI Agent တွေကို အမိန့်ကောင်းကောင်းပေးပြီး Vibe Coding လုပ်နိုင်ဖို့ ဒီအချက်တွေကို သုံးပါ-

### 1. Context အပြည့်အစုံကို AI ကို ပြောပြပါ 💬
AI နဲ့ တူတူ feature အသစ်တွေ ဆောက်တဲ့အခါ AI ကို ဒီလိုမျိုး Vibe Prompt ပေးပါ-
> *"ဒါက Next.js App Router နဲ့ ရေးထားတဲ့ Project Peak Fitness App ဖြစ်တယ်။ Supabase SSR Client (`@supabase/ssr`) ကိုသုံးပြီး user sessions တွေကို middleware မှာ cookies နဲ့ သိမ်းထားတယ်။ local database query compatibility mappings တွေလည်း သုံးထားတယ်။ ငါတို့ feature အသစ် ဆောက်ရအောင်!"*

### 2. Next.js Build Crash မဖြစ်အောင် AI ကို ကြိုထိန်းခိုင်းနည်း 🚨
Next.js က compile လုပ်တဲ့အခါ Supabase Keys မရှိရင် static prerender လုပ်ရင်း build crash တက်တတ်ပါတယ်။ ဒါကြောင့် AI ကို ကုဒ်အသစ်တွေ ရေးခိုင်းတဲ့အခါတိုင်း ဤ **fallback values (အရန်တန်ဖိုးများ)** ကို သုံးခိုင်းပါ-
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );
}
```

### 3. API Routes အသစ်တွေ ရေးခိုင်းတဲ့အခါ 🛠️
AI ကို backend API အသစ်တွေ ရေးခိုင်းရင် serverside client ကို lazy load (POST functions ထဲမှာပဲ instantiate လုပ်ဖို့) ညွှန်ကြားပါ-
```typescript
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient(); // POST ထဲမှာပဲ lazy load လုပ်ခိုင်းပါ
  // database check / insertion logic
}
```

### 4. Build Vibes ကို စစ်ဆေးပါ 🚦
ကုဒ်တွေကို AI နဲ့ ရေးပြီးတာနဲ့ Production ပေါ်တင်ရင် အဆင်ပြေပြေ တက်သွားစေဖို့ terminal မှာ ဒီ command ကို run ပြီး AI နဲ့အတူ error တွေကို copy-paste လုပ်ရင်း Vibe စစ်ဆေးပါ-
```bash
npm run build
```

---
💡 **Vibe Coder Tip:** ဤလမ်းညွှန်ဖိုင် `MIGRATION_AND_AI_GUIDE.md` အား သင့်ရဲ့ AI chat (ဥပမာ- Cursor Chat, Claude Prompt) ထဲသို့ အမြဲတမ်း attachment အဖြစ် ထည့်သွင်းပေးထားပါ။ AI သည် ဤပရောဂျက်၏ vibes ကို ချက်ချင်းနားလည်ပြီး build အောင်မြင်မည့် အလန်းစား features များကို ရေးသားပေးသွားပါလိမ့်မည်။
