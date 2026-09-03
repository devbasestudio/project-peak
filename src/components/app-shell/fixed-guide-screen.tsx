import { Activity, Check, CircleGauge, Play, ShieldCheck, Target, TimerReset, Trophy, Video, type LucideIcon } from "lucide-react";
import { AscentMark } from "@/components/app-shell/ascent-mark";
import type { Locale } from "@/lib/i18n";

export type FixedGuideVariant = "baseline" | "workout" | "phase2" | "completion";

type LocalizedText = { mm: string; en: string };
type GuideStep = { icon: LucideIcon; title: LocalizedText; text: LocalizedText };
type GuideMetric = { value: string; label: LocalizedText };

const copy: Record<FixedGuideVariant, {
  index: string;
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  safety: LocalizedText;
  steps: GuideStep[];
  metrics: GuideMetric[];
}> = {
  baseline: {
    index: "00",
    eyebrow: { mm: "မစခင် စမှတ်", en: "Before the program" },
    title: { mm: "စမ်းပြဖို့ မဟုတ်ဘူး။ စမှတ်ထားဖို့ပါ။", en: "Do not perform. Establish your starting point." },
    description: { mm: "Form မှန်နေသရွေ့ လုပ်နိုင်သလောက်လုပ်ပြီး ရတဲ့အကြိမ်ရေကို အမှန်အတိုင်းမှတ်ပါ။ Week 12 မှာ ဒီရလဒ်နဲ့ ပြန်နှိုင်းယှဉ်ပါမယ်။", en: "Use clean form, record your honest maximum, and compare it with the same test at Week 12." },
    safety: { mm: "ချွန်ထက်တဲ့နာကျင်မှု၊ မူးဝေမှု သို့မဟုတ် အသက်ရှူမဝတာဖြစ်ရင် ချက်ချင်းရပ်ပါ။", en: "Stop immediately for sharp pain, dizziness, or unusual shortness of breath." },
    metrics: [
      { value: "04", label: { mm: "လှုပ်ရှားမှု", en: "Movements" } },
      { value: "03:00", label: { mm: "တစ်ခုပြီး နားချိန်", en: "Rest between tests" } },
      { value: "01", label: { mm: "စမှတ်", en: "Baseline record" } },
    ],
    steps: [
      { icon: Activity, title: { mm: "ကိုယ်ပူအောင် လှုပ်ရှားပါ", en: "Warm up first" }, text: { mm: "၅–၈ မိနစ်လောက် ပေါ့ပေါ့ပါးပါး လှုပ်ရှားပြီးမှ စမ်းပါ။", en: "Move lightly for 5–8 minutes before testing." } },
      { icon: Target, title: { mm: "Form ကိုဦးစားပေးပါ", en: "Protect your form" }, text: { mm: "Form ပျက်တော့မယ့်အချိန်မှာ ရပ်ပါ။ မမှန်တဲ့အကြိမ်ကို မရေတွက်ပါနဲ့။", en: "Stop before form breaks and count only clean reps." } },
      { icon: TimerReset, title: { mm: "ရလဒ်မှတ်ပြီး နားပါ", en: "Record, then recover" }, text: { mm: "ရတဲ့အကြိမ်ရေကို ထည့်ပြီး နောက်တစ်ခုမစခင် ၃ မိနစ်နားပါ။", en: "Enter your reps and rest three minutes before the next movement." } },
    ],
  },
  workout: {
    index: "GO",
    eyebrow: { mm: "ဒီနေ့ Session", en: "Today’s session" },
    title: { mm: "လုပ်ရမှာ သုံးခုပဲ။", en: "Three things. One clear session." },
    description: { mm: "Video ကြည့်ပါ။ သတ်မှတ်ထားတဲ့အကြိမ်ရေ လုပ်ပါ။ ပြီးရင် တကယ်ရတဲ့ reps နဲ့ weight ကိုမှတ်ပြီး Set ပြီးပြီလို့နှိပ်ပါ။", en: "Watch the movement, complete the target, then record your real reps and load before marking the set done." },
    safety: { mm: "Form ပျက်လာရင် reps လျှော့ပါ သို့မဟုတ် အစားထိုး Video ကိုသုံးပါ။ လွယ်အောင်ပြောင်းတာက မအောင်မြင်တာမဟုတ်ပါဘူး။", en: "If form breaks, reduce the reps or use the alternative movement. Scaling is part of good training." },
    metrics: [
      { value: "01", label: { mm: "Video ကြည့်", en: "Watch" } },
      { value: "02", label: { mm: "လုပ်", en: "Train" } },
      { value: "03", label: { mm: "မှတ်", en: "Record" } },
    ],
    steps: [
      { icon: Video, title: { mm: "နည်းလမ်းရွေးပါ", en: "Choose your version" }, text: { mm: "အဓိက Video ကိုကြည့်ပါ။ မအဆင်ပြေရင် Alternative ကို swipe လုပ်ရွေးပါ။", en: "Use the main video, or swipe to the alternative when needed." } },
      { icon: Play, title: { mm: "သတ်မှတ်ထားတာလုပ်ပါ", en: "Complete the target" }, text: { mm: "Sets နဲ့ reps ကို Form မှန်မှန်နဲ့လုပ်ပါ။ အလျင်မလိုပါဘူး။", en: "Complete the sets and reps with control. There is no need to rush." } },
      { icon: Check, title: { mm: "အမှန်အတိုင်းမှတ်ပါ", en: "Log the honest result" }, text: { mm: "Reps/weight ကိုပြင်ပြီး Set ပြီးမှ Done နှိပ်ပါ။ Rest timer အလိုအလျောက်စပါမယ်။", en: "Adjust reps or load, tap Done, and the rest timer starts automatically." } },
    ],
  },
  phase2: {
    index: "02",
    eyebrow: { mm: "Phase 2 ဖွင့်ပြီး", en: "Phase 2 unlocked" },
    title: { mm: "အခြေခံတည်ပြီးပြီ။ အခု ပိုကောင်းအောင်တည်ဆောက်မယ်။", en: "The base is built. Now we raise the standard." },
    description: { mm: "Session ၁၂ ခုကိုပြီးအောင်လုပ်နိုင်ခဲ့တာက system တစ်ခုတည်လာပြီဆိုတဲ့သက်သေပါ။ အခုက reps များအောင်အလျင်လိုတာထက် Form နဲ့ consistency ကိုဆက်ထိန်းရမယ့်အဆင့်ပါ။", en: "Twelve completed sessions prove the system is taking shape. Keep the form and consistency as the work progresses." },
    safety: { mm: "ခက်လာတာက မှန်ပါတယ်။ နာကျင်လာတာတော့ မဟုတ်ပါဘူး။ Recovery day နဲ့ အိပ်ချိန်ကို မကျော်ပါနဲ့။", en: "Harder is expected; pain is not. Protect recovery days and sleep." },
    metrics: [
      { value: "12", label: { mm: "Session ပြီး", en: "Sessions complete" } },
      { value: "36", label: { mm: "Session ကျန်", en: "Sessions remaining" } },
      { value: "02", label: { mm: "အဆင့်သစ်", en: "Current phase" } },
    ],
    steps: [
      { icon: CircleGauge, title: { mm: "Control မလွတ်ပါနဲ့", en: "Keep control" }, text: { mm: "အကြိမ်များဖို့ထက် လှုပ်ရှားမှုကိုထိန်းနိုင်တာကို ဦးစားပေးပါ။", en: "Prioritize control before adding more reps." } },
      { icon: Target, title: { mm: "ပြီးခဲ့တဲ့ Set ကိုကျော်ပါ", en: "Build from the last set" }, text: { mm: "ပြီးခဲ့တဲ့ရလဒ်ထက် rep တစ်ကြိမ် သို့မဟုတ် control နည်းနည်းပိုကောင်းရုံလုံလောက်ပါတယ်။", en: "One cleaner rep or slightly better control is enough progress." } },
      { icon: ShieldCheck, title: { mm: "Recovery ကို Program ထဲထည့်ပါ", en: "Recovery is training" }, text: { mm: "အနားယူရက်၊ ရေ၊ Protein နဲ့အိပ်ချိန်က Session လိုပဲအရေးကြီးပါတယ်။", en: "Rest days, water, protein, and sleep belong to the program." } },
    ],
  },
  completion: {
    index: "12",
    eyebrow: { mm: "Week 12 · Final Check", en: "Week 12 · Final check" },
    title: { mm: "အစက ကိုယ်နဲ့ အခုကို ပြန်ယှဉ်မယ်။", en: "Meet your starting point again." },
    description: { mm: "Baseline တုန်းက Form နဲ့အခြေအနေတူအောင် စမ်းပြီး အခုရတဲ့အကြိမ်ရေကိုမှတ်ပါ။ ပြီးရင် Program ထဲက အဓိက Knowledge Quiz ကိုဖြေပါမယ်။", en: "Repeat the baseline under the same conditions, record today’s result, then complete the program knowledge check." },
    safety: { mm: "ရလဒ်က နံပါတ်တစ်ခုတည်းမဟုတ်ပါဘူး။ Form၊ control၊ consistency နဲ့ habit တွေပါ တိုးတက်မှုထဲပါပါတယ်။", en: "Progress is more than one number. Form, control, consistency, and habits count too." },
    metrics: [
      { value: "47", label: { mm: "Workout Session ပြီး", en: "Workouts complete" } },
      { value: "04", label: { mm: "ပြန်စမ်းမယ့် လှုပ်ရှားမှု", en: "Retest movements" } },
      { value: "48", label: { mm: "Final Challenge", en: "Final challenge" } },
    ],
    steps: [
      { icon: Activity, title: { mm: "အခြေအနေတူအောင်ထားပါ", en: "Match the conditions" }, text: { mm: "တူညီတဲ့ Form၊ equipment နဲ့ warm-up ကိုသုံးပါ။", en: "Use the same form, equipment, and warm-up." } },
      { icon: Trophy, title: { mm: "အခုရလဒ်ကိုမှတ်ပါ", en: "Record today’s proof" }, text: { mm: "Form မှန်နေသရွေ့ အများဆုံးလုပ်ပြီး အကြိမ်ရေကိုထည့်ပါ။", en: "Complete your clean maximum and record it." } },
      { icon: Check, title: { mm: "Knowledge ကိုသေချာစေပါ", en: "Lock in the knowledge" }, text: { mm: "Quiz ကိုဖြေပြီး Program ပြီးဆုံးမှုနဲ့ တိုးတက်မှုကိုကြည့်ပါ။", en: "Finish the quiz, then review your full progress." } },
    ],
  },
};

function localized(text: LocalizedText, locale: Locale) {
  return locale === "mm" ? text.mm : text.en;
}

export function FixedGuideScreen({ variant, locale, dayNumber, dayType }: { variant: FixedGuideVariant; locale: Locale; dayNumber?: number; dayType?: string }) {
  const guide = copy[variant];
  const mm = locale === "mm";
  const metrics = variant === "workout" && dayNumber
    ? [
        { value: String(dayNumber).padStart(2, "0"), label: { mm: "Session / 48", en: "Session / 48" } },
        { value: dayType || "—", label: { mm: "ဒီနေ့အမျိုးအစား", en: "Session type" } },
        { value: "AUTO", label: { mm: "နားချိန် Timer", en: "Rest timer" } },
      ]
    : guide.metrics;

  return (
    <section aria-label={localized(guide.eyebrow, locale)} className="mx-auto mb-6 max-w-4xl overflow-hidden rounded-3xl border border-charcoal/12 bg-white shadow-[0_18px_55px_rgba(6,17,26,.07)]">
      <div className="relative overflow-hidden bg-charcoal px-5 py-6 text-white sm:px-8 sm:py-8">
        <AscentMark className="pointer-events-none absolute -right-16 -top-6 h-48 w-80 text-sky/18 sm:h-56 sm:w-96" />
        <div className="relative flex items-start gap-4 sm:gap-6">
          <span className="mono grid h-11 w-11 shrink-0 place-items-center border border-white/18 bg-white/[.06] text-xs font-bold text-sky sm:h-13 sm:w-13">{guide.index}</span>
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.2em] text-sky">{localized(guide.eyebrow, locale)}</p>
            <h2 className="mt-3 max-w-3xl font-display text-2xl font-black leading-tight tracking-[-.04em] sm:text-4xl" lang={mm ? "my" : "en"}>{localized(guide.title, locale)}</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58" lang={mm ? "my" : "en"}>{localized(guide.description, locale)}</p>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-3 border-y border-white/12">
          {metrics.map((metric) => (
            <div className="min-w-0 border-r border-white/12 px-3 py-4 last:border-r-0 sm:px-5" key={metric.value + metric.label.en}>
              <strong className="mono block truncate text-lg font-black text-sky sm:text-2xl">{metric.value}</strong>
              <span className="mt-1 block text-[8px] font-semibold uppercase leading-4 tracking-[.08em] text-white/40 sm:text-[9px]">{localized(metric.label, locale)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid divide-y divide-charcoal/8 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {guide.steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <article className="p-5 sm:p-6" key={step.title.en}>
              <div className="flex items-center justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-ice text-aqua"><Icon size={18} /></span><span className="mono text-[9px] font-bold text-charcoal/22">0{index + 1}</span></div>
              <h3 className="mt-4 text-sm font-bold" lang={mm ? "my" : "en"}>{localized(step.title, locale)}</h3>
              <p className="mt-2 text-xs leading-6 text-charcoal/50" lang={mm ? "my" : "en"}>{localized(step.text, locale)}</p>
            </article>
          );
        })}
      </div>

      <div className="flex items-start gap-3 border-t border-charcoal/8 bg-ice/45 px-5 py-4 text-xs leading-6 text-charcoal/58 sm:px-6" lang={mm ? "my" : "en"}><ShieldCheck className="mt-0.5 shrink-0 text-aqua" size={17} /><span>{localized(guide.safety, locale)}</span></div>
    </section>
  );
}
