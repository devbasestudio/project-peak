import type { Locale } from "@/lib/i18n";

export type LandingCopy = {
  nav: { program: string; method: string; journey: string; faq: string; signIn: string };
  hero: { kicker: string; title: string; body: string; primary: string; secondary: string; badge: string };
  thesis: { eyebrow: string; title: string; body: string };
  pillars: Array<{ number: string; title: string; body: string }>;
  journey: Array<{ step: string; title: string; body: string }>;
  showcase: { eyebrow: string; title: string; body: string };
  equipment: { eyebrow: string; title: string; body: string; items: string[] };
  mission: { eyebrow: string; title: string; body: string };
  vision: { eyebrow: string; title: string; body: string };
  price: { eyebrow: string; title: string; body: string; button: string; note: string };
  faq: { eyebrow: string; title: string; items: Array<{ q: string; a: string }> };
  footer: string;
};

export const landingCopy: Record<Locale, LandingCopy> = {
  mm: {
    nav: { program: "အစီအစဉ်", method: "လေ့ကျင့်နည်း", journey: "၁၂ ပတ်", faq: "မေးခွန်းများ", signIn: "အကောင့်ဝင်မယ်" },
    hero: {
      kicker: "BACKPACK METHOD · HOME WORKOUT",
      title: "အိမ်မှာပဲ ပိုသန်မာလာစေမယ့် ၁၂ ပတ် လေ့ကျင့်ခန်းအစီအစဉ်",
      body: "Gym သွားစရာမလိုပါဘူး။ ကျောပိုးအိတ်တစ်လုံးနဲ့ အိမ်မှာပဲ တစ်ဆင့်ချင်း လေ့ကျင့်ပြီး ပိုသန်မာတဲ့ ခန္ဓာကိုယ်နဲ့ ရေရှည်လိုက်နာနိုင်မယ့် အလေ့အကျင့်ကို တည်ဆောက်မယ်။",
      primary: "အစီအစဉ်ကို စမယ်",
      secondary: "လုပ်ဆောင်ပုံကို ကြည့်မယ်",
      badge: "တစ်ကြိမ်ပေးချေ · ၁၂ ပတ်အပြည့်",
    },
    thesis: {
      eyebrow: "ရလဒ်နောက်ကိုပဲ မလိုက်နဲ့",
      title: "ခဏတာပြောင်းလဲမှုမဟုတ်ဘူး။ ရေရှည်လိုက်နာနိုင်မယ့် စနစ်တစ်ခုကို တည်ဆောက်မယ်။",
      body: "ခဏခဏ ပြန်စပြီး မကြာခင် ရပ်သွားတာက ရလဒ်ကိုပဲ အလျင်လိုနေလို့ပါ။ ဘာကြောင့်လုပ်ရသလဲ နားလည်ပြီး နေ့စဉ်လိုက်နာနိုင်တဲ့ အလေ့အကျင့်ရှိလာရင် ခန္ဓာကိုယ်က တဖြည်းဖြည်း ပြောင်းလဲလာမယ်။",
    },
    pillars: [
      { number: "01", title: "နားလည်မှု", body: "အချက်အလက်တွေ အများကြီးကျက်မှတ်စရာမလိုပါဘူး။ လေ့ကျင့်ခန်းတစ်ကြိမ်ပြီးတိုင်း နောက်တစ်ကြိမ်မှာ ပိုကောင်းအောင်လုပ်နိုင်မယ့် အချက်တစ်ခုကို ရှင်းရှင်းလင်းလင်း လေ့လာမယ်။" },
      { number: "02", title: "အလေ့အကျင့်", body: "ပရိုတင်း၊ ရေသောက်ခြင်း၊ အိပ်ချိန်နဲ့ လေ့ကျင့်ပြီးစီးမှုကို လွယ်လွယ်ကူကူ မှတ်တမ်းတင်မယ်။ အရာရာပြည့်စုံဖို့မလိုဘူး—မရပ်ဘဲ ဆက်လုပ်နိုင်ဖို့ပဲလိုတယ်။" },
    ],
    journey: [
      { step: "00", title: "အစမ်းတိုင်းတာခြင်း", body: "လက်ရှိအင်အားကို လှုပ်ရှားမှု ၄ မျိုးနဲ့ တိတိကျကျ မှတ်တမ်းတင်မယ်။" },
      { step: "01—12", title: "အခြေခံတည်ဆောက်ခြင်း", body: "လှုပ်ရှားပုံမှန်ကန်ရေးနဲ့ လေ့ကျင့်ခန်းပုံစံကို အရင်ဆုံး ကျွမ်းကျင်အောင်လုပ်မယ်။" },
      { step: "13—48", title: "တဖြည်းဖြည်းတိုးခြင်း", body: "အကြိမ်ရေနဲ့ အလေးချိန်ကို အဆင့်လိုက်တိုးပြီး တစ်ကြိမ်ထက်တစ်ကြိမ် ပိုသန်မာလာမယ်။" },
      { step: "48", title: "နောက်ဆုံးစမ်းသပ်မှု", body: "ပထမပတ်က ကိုယ့်ရလဒ်ကို ပြန်ကျော်နိုင်အောင် ကြိုးစားမယ်။" },
      { step: "END", title: "ရလဒ်", body: "ပထမပတ်နဲ့ နောက်ဆုံးပတ် ရလဒ်ကို ဘေးချင်းယှဉ်ပြီး တိုးတက်မှုကို မြင်ရမယ်။" },
    ],
    showcase: {
      eyebrow: "လက်ထဲက ကိုယ်ပိုင်လမ်းညွှန်",
      title: "ဘာလုပ်ရမလဲ သိရုံတင်မဟုတ်ဘဲ လေ့ကျင့်နေချိန်မှာပါ အဆင့်လိုက် လမ်းညွှန်ပေးမယ်။",
      body: "အကြိမ်ရေ၊ အလေးချိန်၊ နားချိန်၊ လှုပ်ရှားပုံနဲ့ တိုးတက်မှုအားလုံးကို တစ်နေရာတည်းမှာ ကြည့်နိုင်မယ်။ တစ်ရက်လွတ်သွားလို့ အစကပြန်စရာမလိုဘူး။ နောက်လေ့ကျင့်ခန်းကနေ ပြန်ဆက်ရုံပဲ။",
    },
    equipment: {
      eyebrow: "လိုအပ်တဲ့ပစ္စည်းများ",
      title: "အိမ်မှာရှိတာနဲ့ စလို့ရတယ်။",
      body: "စက်ပစ္စည်းအများကြီး မလိုပါဘူး။ လုံခြုံပြီး ခိုင်ခံ့တဲ့ ပစ္စည်းအနည်းငယ်ပဲလိုတယ်။",
      items: ["ခိုင်ခံ့တဲ့ ကျောပိုးအိတ်တစ်လုံး", "တံခါးဘောင်မှာတပ်တဲ့ ဆွဲတန်း", "Dip station သို့မဟုတ် မလှုပ်မယှက် ခိုင်ခံ့တဲ့ထိုင်ခုံနှစ်လုံး", "၄ လီတာ ရေဘူးနှစ်ဘူး"],
    },
    mission: {
      eyebrow: "ရည်ရွယ်ချက်",
      title: "လေ့ကျင့်ခန်းကို မကြိုက်သေးတဲ့သူတောင် စလုပ်ချင်လာအောင် ရှင်းလင်းပြီး လက်တွေ့ကျစေဖို့။",
      body: "အချက်အလက်တွေကြားမှာ လမ်းမပျောက်ဘဲ တကယ်အသုံးဝင်တဲ့ နားလည်မှုကို နေ့စဉ်လက်တွေ့လုပ်ဆောင်နိုင်အောင် စီစဉ်ထားတယ်။",
    },
    vision: {
      eyebrow: "မျှော်မှန်းချက်",
      title: "ကိုယ်ရောစိတ်ပါ ပိုသန်မာကျန်းမာတဲ့ မြန်မာလူမှုအသိုင်းအဝိုင်း။",
      body: "ကျန်းမာကြံ့ခိုင်ခြင်းက ခန္ဓာကိုယ်ပုံစံတစ်ခုတည်းကို ပြောင်းလဲတာမဟုတ်ပါဘူး။ ကိုယ့်ကိုယ်ကိုယုံကြည်မှု၊ နေ့စဉ်စွမ်းအင်နဲ့ ဘဝအရည်အသွေးကိုပါ ပိုကောင်းစေတယ်။",
    },
    price: {
      eyebrow: "HOME WORKOUT · 12 WEEKS",
      title: "75,000 MMK",
      body: "Google အကောင့်နဲ့ ဝင်ပါ။ ဝယ်ယူမှုအမှတ်နဲ့ KBZPay ငွေလွှဲပြေစာ screenshot ကို Telegram @wayneax21 ဆီ ပို့ပေးပါ။ ငွေပေးချေမှုအတည်ပြုပြီးတာနဲ့ ကိုယ်ပိုင် ၁၂ ပတ်အစီအစဉ်ကို ဖွင့်ပေးမယ်။",
      button: "ဝယ်ယူမှုကို ဆက်လုပ်မယ်",
      note: "KBZPay ဖြင့် တစ်ကြိမ်သာ ပေးချေရန်",
    },
    faq: {
      eyebrow: "မေးလေ့ရှိတဲ့မေးခွန်းများ",
      title: "မစခင် သိထားသင့်တာတွေ။",
      items: [
        { q: "တစ်ပတ်မှာ ၄ ကြိမ်မလေ့ကျင့်နိုင်ရင် နောက်ကျသွားမလား။", a: "မနောက်ကျပါဘူး။ ရက်သတ်မှတ်ချက်နဲ့ မသွားဘဲ ပြီးထားတဲ့လေ့ကျင့်ခန်းနောက်ကနေ ဆက်လုပ်ရုံပါပဲ။" },
        { q: "လေ့ကျင့်ခန်းမလုပ်ဖူးသေးတဲ့သူ လုပ်လို့ရလား။", a: "လုပ်လို့ရပါတယ်။ ပထမဆုံး ၁၂ ကြိမ်ကို လှုပ်ရှားပုံမှန်ကန်ရေးနဲ့ အခြေခံပုံစံတွေ ရအောင် အထူးစီစဉ်ထားတယ်။" },
        { q: "Gym က စက်ပစ္စည်းတွေ လိုသလား။", a: "မလိုပါဘူး။ ကျောပိုးအိတ်၊ ဆွဲတန်း၊ ခိုင်ခံ့တဲ့ထိုင်ခုံနှစ်လုံးနဲ့ ၄ လီတာ ရေဘူးနှစ်ဘူးလောက်ပဲလိုတယ်။" },
        { q: "အင်တာနက်မရှိချိန်မှာ မှတ်တမ်းတင်လို့ရလား။", a: "ရပါတယ်။ လေ့ကျင့်ခန်းမှတ်တမ်းကို ဖုန်းထဲမှာ အရင်သိမ်းထားပြီး အင်တာနက်ပြန်ရတဲ့အခါ အလိုအလျောက် ပို့ပေးမယ်။" },
      ],
    },
    footer: "နားလည်မှု · အလေ့အကျင့် · ကိုယ်ပိုင်စနစ်",
  },
  en: {
    nav: { program: "Program", method: "Method", journey: "12 Weeks", faq: "FAQ", signIn: "Sign in" },
    hero: {
      kicker: "BACKPACK METHOD · HOME WORKOUT",
      title: "A 12-week plan built to turn the body in your head into work you actually do",
      body: "You do not need to make the gym your whole life. Build the knowledge and habits that create a fitness identity you can carry into any season",
      primary: "Start the program",
      secondary: "See how it works",
      badge: "One payment · Full 12 weeks",
    },
    thesis: {
      eyebrow: "STOP CHASING THE BODY",
      title: "Not a temporary result. A system you can keep for life",
      body: "The cycle of “I’ll start again properly” happens when you only chase the body. Build useful knowledge and automatic habits, and the body follows",
    },
    pillars: [
      { number: "01", title: "Knowledge", body: "No information dump. After each workout, learn one clear idea that makes the next session smarter" },
      { number: "02", title: "Habits", body: "Track protein, water, sleep and sessions without turning life into a spreadsheet. Consistency, not perfection" },
    ],
    journey: [
      { step: "00", title: "Baseline", body: "Capture today with four simple movements" },
      { step: "01—12", title: "Phase 1", body: "Own the form and movement patterns first" },
      { step: "13—48", title: "Phase 2", body: "Grow stronger through double progression" },
      { step: "48", title: "Final Challenge", body: "Beat the Week 1 version of you" },
      { step: "END", title: "Proof", body: "Finish the quiz and compare Week 1 with Week 12" },
    ],
    showcase: {
      eyebrow: "COACHING IN YOUR POCKET",
      title: "Know what to do—and get guided while you do it",
      body: "Sets, reps, load, rest timers, cues, lessons and progress live in one calm place. No calendar pressure, no punishment for a missed day. Return to the next session in your queue",
    },
    equipment: {
      eyebrow: "WHAT YOU NEED",
      title: "Start with what you have at home",
      body: "No room full of machines. Just a safe, simple setup",
      items: ["A backpack", "Doorway pull-up bar", "Dip station or two stable chairs", "Two 4 L water bottles"],
    },
    mission: {
      eyebrow: "MISSION",
      title: "Make fitness clear, practical and inviting—even for people who do not love it yet",
      body: "The useful knowledge is curated into a path you can act on, without getting lost in endless information",
    },
    vision: {
      eyebrow: "VISION",
      title: "A stronger, healthier Myanmar—physically and mentally",
      body: "Being fit changes more than how you look. It changes confidence, energy, decisions and the quality of everyday life",
    },
    price: {
      eyebrow: "HOME WORKOUT · 12 WEEKS",
      title: "75,000 MMK",
      body: "Sign in with Google, then send your purchase reference code with your KPay screenshot to @wayneax21 on Telegram. Your personal program opens after confirmation",
      button: "Continue to purchase",
      note: "Manual KPay verification · One-time payment",
    },
    faq: {
      eyebrow: "FAQ",
      title: "Everything to know before you start",
      items: [
        { q: "Am I behind if I cannot train four times this week?", a: "No. The program has no calendar. You continue from the next session in your queue" },
        { q: "Can a beginner do this?", a: "Yes. The first 12 sessions are deliberately built around form and movement patterns" },
        { q: "Do I need gym equipment?", a: "Only a backpack, pull-up bar, stable chairs or dip station, and two 4 L bottles" },
        { q: "Can I log workouts without internet?", a: "Yes. Logs save on your device first and sync when connection returns" },
      ],
    },
    footer: "Knowledge · Habits · Identity",
  },
};
