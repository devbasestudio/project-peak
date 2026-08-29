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
    nav: { program: "Program", method: "နည်းလမ်း", journey: "12 Weeks", faq: "မေးခွန်းများ", signIn: "ဝင်မယ်" },
    hero: {
      kicker: "BACKPACK METHOD · HOME WORKOUT",
      title: "စိတ်ကူးထဲက body ကို တကယ်လိုက်လုပ်ဖြစ်အောင် စီစဉ်ထားတဲ့ 12 weeks plan",
      body: "Gym ကိုဘဝကြီးလိုဆော့စရာမလိုဘူး။ Knowledge နဲ့ habit နှစ်ခုကို တစ်ဆင့်ချင်းတည်ဆောက်ပြီး ဘယ်အခြေအနေမှာမဆို ဆက်လုပ်နိုင်မယ့် fitness identity ကိုဖန်တီးမယ်",
      primary: "Program ကိုစမယ်",
      secondary: "ဘယ်လိုအလုပ်လုပ်လဲ",
      badge: "တစ်ကြိမ်ဝယ် · 12 ပတ်အပြည့်",
    },
    thesis: {
      eyebrow: "BODY နောက်လိုက်နေတာကို ရပ်မယ်",
      title: "ခဏတာ result မဟုတ်ဘူး။ တစ်သက်သာခံမယ့် system ကိုတည်ဆောက်မယ်",
      body: "“ငါသေချာပြန်လုပ်မယ်” ဆိုတဲ့ သံသရာလည်တာက body နောက်ကိုပဲလိုက်လို့။ အဓိက knowledge နဲ့ သိထားတာကို auto လိုက်လုပ်စေတဲ့ habit ရှိရင် body က သေချာပေါက်လိုက်လာမယ်",
    },
    pillars: [
      { number: "01", title: "Knowledge", body: "အချက်အလက်ပုံကြီးမဟုတ်ဘူး။ Workout တစ်ခုပြီးတိုင်း နားလည်ဖို့လိုတဲ့အရာတစ်ခုကို ရှင်းရှင်းလင်းလင်းသင်မယ်" },
      { number: "02", title: "Habits", body: "Protein၊ ရေ၊ အိပ်ချိန်နဲ့ session ကို ရှုပ်မနေဘဲမှတ်မယ်။ Perfect ဖြစ်ဖို့မလိုဘူး၊ ဆက်လုပ်ဖြစ်ဖို့ပဲလိုတယ်" },
    ],
    journey: [
      { step: "00", title: "Baseline", body: "ဒီနေ့အခြေအနေကို movement 4 ခုနဲ့ သိမ်းထားမယ်" },
      { step: "01—12", title: "Phase 1", body: "Form နဲ့ movement pattern ကို အရင်ပိုင်အောင်လေ့ကျင့်မယ်" },
      { step: "13—48", title: "Phase 2", body: "Double progression နဲ့ တစ်ခါချင်းစီ ပိုအားကောင်းလာမယ်" },
      { step: "48", title: "Final Challenge", body: "Week 1 ကကိုယ့်ကိုယ်ကို ပြန်ကျော်မယ်" },
      { step: "END", title: "Proof", body: "Quiz ပြီးရင် Week 1 နဲ့ Week 12 ကို ဘေးချင်းယှဉ်မြင်မယ်" },
    ],
    showcase: {
      eyebrow: "COACHING IN YOUR POCKET",
      title: "ဘာလုပ်ရမလဲ သိနေရုံမက လုပ်နေချိန်မှာပါ လမ်းညွှန်ပေးမယ်",
      body: "Sets, reps, load, rest timer, cues, lesson နဲ့ progress အကုန် တစ်နေရာထဲမှာ။ Calendar ဖိအားမရှိဘူး၊ missed day အပြစ်မပေးဘူး။ ပြီးထားတဲ့ session နောက်တစ်ခုကနေ ပြန်ဆက်ရုံပဲ",
    },
    equipment: {
      eyebrow: "ဘာတွေလိုမလဲ",
      title: "အိမ်မှာရှိတာနဲ့ စလို့ရတယ်",
      body: "အလေးချိန်ကြီးတဲ့ equipment မလိုဘူး။ စိတ်ချရတဲ့ setup လေးပဲလိုတယ်",
      items: ["Backpack", "Doorway pull-up bar", "Dip station သို့မဟုတ် ခိုင်တဲ့ခုံနှစ်လုံး", "4 L ရေဘူးနှစ်ဘူး"],
    },
    mission: {
      eyebrow: "MISSION",
      title: "Fitness ကို ဝါသနာမပါတဲ့သူတောင် လိုက်လုပ်ချင်အောင် ရှင်းလင်းပြီး လက်တွေ့ကျစေဖို့",
      body: "Information အများကြီးကြားမှာ စိတ်ရှုပ်မသွားဘဲ တကယ်ပြောင်းလဲစေမယ့် knowledge ကို လက်တွေ့လိုက်လုပ်လို့အဆင်ပြေအောင် စီစဉ်ထားတယ်",
    },
    vision: {
      eyebrow: "VISION",
      title: "ပိုကျစ်လစ်၊ စိတ်ကောလူကောကျန်းမာတဲ့ မြန်မာလူမှုအသိုင်းအဝိုင်း",
      body: "Fit ဖြစ်တာက ပြင်ပ body တစ်ခုတည်းမဟုတ်ဘူး။ ဘဝအရည်အသွေး၊ ကိုယ့်ကိုယ်ကိုယုံကြည်မှုနဲ့ နေ့စဉ်လုပ်ရပ်တွေကိုပါ ပိုကောင်းစေတယ်",
    },
    price: {
      eyebrow: "HOME WORKOUT · 12 WEEKS",
      title: "75,000 MMK",
      body: "Google account နဲ့ဝင်ပြီး purchase reference code ကို KPay screenshot နဲ့အတူ Telegram @wayneax21 ဆီပို့ပါ။ Confirm ပြီးတာနဲ့ personal program ကိုဖွင့်ပေးမယ်",
      button: "ဝယ်ယူဖို့ဆက်မယ်",
      note: "Manual KPay verification · One-time payment",
    },
    faq: {
      eyebrow: "မေးလေ့ရှိတာတွေ",
      title: "မစခင် သိထားရမယ့်အရာတွေ",
      items: [
        { q: "တစ်ပတ် 4 ရက်မပြည့်ရင် နောက်ကျသွားမလား", a: "မနောက်ကျဘူး။ Calendar မသုံးဘဲ ပြီးထားတဲ့ session အရေအတွက်နဲ့ပဲ ဆက်သွားတယ်" },
        { q: "Beginner လုပ်လို့ရလား", a: "ရတယ်။ ပထမ 12 sessions ကို form နဲ့ movement pattern ရဖို့ပဲ ရည်ရွယ်ထားတယ်" },
        { q: "Gym equipment လိုလား", a: "Backpack, pull-up bar, ခိုင်တဲ့ခုံနှစ်လုံးနဲ့ 4 L ရေဘူးလောက်ပဲလိုတယ်" },
        { q: "Internet မရှိရင် log လုပ်လို့ရလား", a: "Workout log ကို device မှာအရင်သိမ်းပြီး connection ပြန်ရတဲ့အခါ sync လုပ်မယ်" },
      ],
    },
    footer: "Knowledge · Habits · Identity",
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
