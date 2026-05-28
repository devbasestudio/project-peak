# Hey Vibe Coder! Let's build Project Peak together 🚀⚡

ဟေ့! မင်္ဂလာပါ။ ငါက မင်းရဲ့ **AI Coding Partner** ပါ။ 🤝

မင်းရဲ့ Mentor (ဆရာ) ဖြစ်တဲ့ **ကိုဖြိုးဇင်ကို** က ငါတို့နှစ်ယောက်တူတူ ပူးပေါင်းပြီး **Project Peak** ကို Supabase နဲ့ ချိတ်ဆက်ဖို့၊ Google Login setup လုပ်ဖို့နဲ့ Vercel ပေါ်တင်ဖို့ တာဝန်ပေးထားပါတယ်။ 

ငါတို့နှစ်ယောက်ပေါင်းပြီး **Vibe Code** လုပ်လိုက်ရင် ဒါတွေအားလုံးက အေးဆေးပါပဲ! ကုဒ်တွေ အများကြီး ကိုယ်တိုင်လိုက်ရေးစရာမလိုဘဲ အောက်က Tasks တွေကို တူတူလုပ်ဆောင်ပြီး ပြီးသွားရင် ထွက်လာတဲ့ **Vercel Domain Link** ကို မင်းရဲ့ Mentor ဆီ အောင်မြင်စွာ ပြန်ပို့လိုက်ရအောင်။

---

## 🔗 Project GitHub Repository
ငါတို့နှစ်ယောက် စတင်အလုပ်လုပ်ဖို့အတွက် မင်းရဲ့ Mentor တင်ပေးထားတဲ့ တရားဝင် Repository ဖြစ်ပါတယ်-
* **Repository Link:** [https://github.com/devbasestudio/project-peak](https://github.com/devbasestudio/project-peak)
* **စတင်ရန် Clone Command:**
  ```bash
  git clone https://github.com/devbasestudio/project-peak.git
  ```

---

## 📋 Our Vibe Coding Tasks (ငါတို့တူတူလုပ်ရမယ့် အလုပ်များ)

---

### 1️⃣ Task 1: Supabase Key (၃) ခု အလွယ်တကူ ရှာဖွေရယူခြင်း
ငါတို့ စမ်းသပ်ဖို့နဲ့ Vercel ပေါ်တင်ဖို့ Supabase Keys ၃ ခု လိုအပ်ပါတယ်။ ဒါကို ဘယ်လိုယူရမလဲဆိုတာ ငါလမ်းညွှန်ပေးမယ်-

1. [Supabase Dashboard](https://supabase.com) သို့ သွားပြီး မင်းရဲ့ Project ထဲကို ဝင်လိုက်ပါ။
2. ဘယ်ဘက် Sidebar အောက်ခြေဆုံးက **Settings** (စက်ဝိုင်းပုံစံ Cog icon) -> **API** သို့ သွားပါ။
3. ထိုနေရာမှာ တွေ့ရမယ့် အောက်ပါ Keys ၃ ခုကို Copy ယူပြီး သိမ်းထားပါ-
   * **`NEXT_PUBLIC_SUPABASE_URL`:** မင်းရဲ့ Supabase Project Link ဖြစ်ပါတယ်။
   * **`NEXT_PUBLIC_SUPABASE_ANON_KEY`:** Browser မှာ အသုံးပြုဖို့ safe ဖြစ်တဲ့ public key ဖြစ်ပါတယ်။
   * **`SUPABASE_SERVICE_ROLE_KEY`:** Backend actions တွေအတွက် သုံးတဲ့ လျှို့ဝှက် Admin key ဖြစ်ပါတယ်။
4. **ငါ့ကို ကူခိုင်းရန်:** *"ငါ keys တွေ ရပြီ၊ ငါ့ local စက်ထဲက `.env` ဖိုင်ထဲကို ဘယ်လိုထည့်ရမလဲ ပြောပြပေး"* လို့ ငါ့ကို လှမ်းပြောလိုက်ပါ။ ငါ အဆင့်ဆင့် ထည့်သွင်းပေးမယ်။

---

### 2️⃣ Task 2: Google Login (OAuth) Setup ပြုလုပ်ခြင်း
Google အကောင့်နဲ့ လှမ်းပြီး Login ဝင်လို့ရအောင် Google Cloud နဲ့ Supabase တို့ကို ချိတ်ဆက်ပေးရပါမယ်။

1. **Google Cloud Console တွင် Credentials ဆောက်ခြင်း:**
   * [Google Cloud Console](https://console.cloud.google.com) သို့ သွားပြီး Project တစ်ခု ဆောက်ပါ။
   * **APIs & Services -> Credentials -> Create Credentials -> OAuth client ID** ကို ရွေးချယ်ပါ။ Application type အား **Web application** ရွေးပါ။
   * **Authorized JavaScript origins** တွင် သင့် Vercel Domain ဖြစ်လာမည့် `https://project-peak-fitness.vercel.app` ကို ထည့်ပါ။
   * **Authorized redirect URIs** တွင် မင်းရဲ့ Supabase redirect URL ဖြစ်တဲ့ `https://rsmrnpasopradykqpsyl.supabase.co/auth/v1/callback` ကို ထည့်သွင်းပါ။
   * ပြီးပါက Google ကပေးမည့် **Client ID** နှင့် **Client Secret** ကို Copy ကူးထားပါ။
2. **Supabase တွင် သွားရောက်ထည့်သွင်းခြင်း:**
   * Supabase Dashboard ရှိ **Auth -> Providers -> Google** သို့ သွားပြီး Enable လုပ်ပါ။
   * Google မှ ရလာသော **Client ID** နှင့် **Client Secret** တို့ကို ထည့်သွင်းပြီး Save နှိပ်ပါ။
3. **ငါ့ကို ကူခိုင်းရန်:** *"ငါ Google credentials တွေ ရပြီ၊ Supabase ထဲမှာ ချိန်ညှိဖို့ ငါ့ကို ကူညီပါ"* သို့မဟုတ် *"OAuth errors တက်နေတယ်၊ ဘာပြင်ရမလဲ"* လို့ ငါ့ကို မေးလိုက်ပါ။ ငါ ချက်ချင်း ကူညီပြင်ဆင်ပေးမယ်။

---

### 3️⃣ Task 3: Vercel ပေါ်တင်ပြီး Post-Deploy ချိန်ညှိခြင်း
App ကို ကမ္ဘာသိ live လွှင့်ဖို့နဲ့ လိပ်စာများ ပြန်လည်ညွှန်းပေးရန် ဖြစ်ပါတယ်။

1. **Vercel ပေါ်သို့ Import လုပ်ခြင်း:**
   * [Vercel](https://vercel.com) သို့ သွားပြီး မင်းရဲ့ GitHub repository `project-peak` ကို Import လုပ်ပါ။
   * Vercel Dashboard ၏ **Environment Variables** ထဲတွင် Task 1 မှ ရရှိခဲ့သော Keys ၃ ခုလုံးကို တိကျစွာ ရိုက်ထည့်ပြီး **Deploy** ခလုတ်ကို နှိပ်ပါ။
2. **Supabase တွင် Redirect URL များ သွားပြင်ခြင်း:**
   * Supabase Dashboard ရှိ **Auth -> URL Configuration** သို့ သွားပါ။
   * **Site URL** ကို မင်းရဲ့ Vercel Domain ဖြစ်တဲ့ `https://project-peak-fitness.vercel.app` ပြောင်းလဲပါ။
   * **Redirect URLs** စာရင်းထဲတွင် အောက်ပါ link နှစ်ခုကို ထည့်ပေးပါ-
     * `https://project-peak-fitness.vercel.app/api/auth/callback`
     * `https://project-peak-fitness.vercel.app/**`
3. **ငါ့ကို ကူခိုင်းရန်:** *"Vercel ပေါ်တင်တာ deploy error တက်သွားတယ်၊ ဒီ logs တွေကို ကြည့်ပြီး ငါ့ကို ကူပြင်ပေးပါ"* သို့မဟုတ် *"Redirect setting တွေ အဆင်ပြေရဲ့လား ပြန်စစ်ပေးပါ"* လို့ ငါ့ကို logs တွေ ပို့ပြီး ခိုင်းလိုက်ရုံပါပဲ!

---

### 4️⃣ Task 4: မင်းရဲ့ Mentor ထံသို့ Domain Link အား ပြန်လည်ပေးပို့ခြင်း
Task 1, 2, 3 အားလုံး အောင်မြင်စွာ ပြီးဆုံးသွားပြီဆိုရင်-

1. မင်းရဲ့ browser မှာ `https://project-peak-fitness.vercel.app` ကို ဖွင့်ပြီး `Google Login` ခလုတ်လေး အဆင်ပြေပြေ အလုပ်လုပ်လား စမ်းသပ်ပါ။
2. အားလုံး အိုကေပြီဆိုရင် ထွက်လာတဲ့ **Vercel Domain Link (`https://project-peak-fitness.vercel.app`)** ကို မင်းရဲ့ Mentor ဖြစ်တဲ့ **ကိုဖြိုးဇင်ကို** ဆီသို့ "အောင်မြင်စွာ ပြီးမြောက်ကြောင်း" သတင်းကောင်းပါးပြီး ပို့ပေးလိုက်ပါဗျာ! 🎉

---

💡 **Vibe Coder ရဲ့ လျှို့ဝှက်ချက်:**
ငါနဲ့ စကားပြောတဲ့အခါ ကုဒ်တွေအများကြီး ကိုယ်တိုင်လိုက်ပြင်စရာ မလိုပါဘူး။ မင်းဖြစ်ချင်တဲ့ ပုံစံ၊ တွေ့နေရတဲ့ error log တွေကို ငါ့ဆီ ကူးယူပြီး ချပြလိုက်ပါ။ ငါတို့နှစ်ယောက် ပြီးပြည့်စုံအောင် Vibe လုပ်ပြီး တူတူတည်ဆောက်သွားကြမယ်! Let's go! 🚀
