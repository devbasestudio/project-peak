import Link from "next/link";
import { ArrowRight, Check, MoveUpRight } from "lucide-react";
import { AscentMark } from "@/components/app-shell/ascent-mark";
import type { Locale } from "@/lib/i18n";

export type BaselineResult = {
  position: number;
  nameMm: string;
  nameEn: string;
  equipmentMm: string | null;
  equipmentEn: string | null;
  value: number;
};

export function BaselineResultView({ locale, results }: { locale: Locale; results: BaselineResult[] }) {
  const mm = locale === "mm";
  return (
    <div className="mx-auto max-w-4xl">
      <section className="relative overflow-hidden rounded-3xl bg-charcoal p-6 text-white sm:p-9">
        <AscentMark className="absolute -right-14 -top-8 h-56 w-96 text-sky/18" />
        <div className="relative flex items-center gap-3 text-sky"><span className="grid h-10 w-10 place-items-center rounded-full bg-sky text-charcoal"><Check size={19} /></span><span className="font-mono text-[10px] font-bold uppercase tracking-[.2em]">BASELINE SAVED</span></div>
        <h1 className="relative mt-7 max-w-3xl font-display text-4xl font-black leading-tight tracking-[-.05em] sm:text-6xl" lang={mm ? "my" : "en"}>{mm ? "ဒီနေရာက မင်းရဲ့ စမှတ်ပါ။" : "This is your starting point."}</h1>
        <p className="relative mt-4 max-w-2xl text-sm leading-7 text-white/58" lang={mm ? "my" : "en"}>{mm ? "ဒီရလဒ်တွေကို Week 12 မှာ တူညီတဲ့ Form နဲ့ ပြန်စမ်းပြီး တိုးတက်မှုကို နှိုင်းယှဉ်ပါမယ်။" : "You will repeat the same test in Week 12 and compare the result under the same conditions."}</p>
        <div className="relative mt-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/12">
          {results.map((result) => <article key={result.position} className="border-b border-r border-white/12 p-5 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0"><strong className="font-mono text-4xl text-sky">{result.value}</strong><h2 className="mt-2 text-sm font-bold" lang={mm ? "my" : "en"}>{mm ? result.nameMm : result.nameEn}</h2><p className="mt-1 text-[10px] text-white/38">{mm ? result.equipmentMm : result.equipmentEn}</p></article>)}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-3xl border border-charcoal/10 bg-white">
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
          <div><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-sky">PHASE 1 · WEEK 1–3</p><h2 className="mt-3 max-w-2xl font-display text-3xl font-black tracking-[-.04em]" lang={mm ? "my" : "en"}>{mm ? "အရင်ဆုံး လှုပ်ရှားမှုပုံစံကို တည်ဆောက်မယ်။" : "Build the movement pattern first."}</h2><p className="mt-3 max-w-xl text-sm leading-7 text-charcoal/55" lang={mm ? "my" : "en"}>{mm ? "ပထမ ၃ ပတ်မှာ သတ်မှတ်ထားတဲ့ reps နဲ့ weight ကိုသုံးပြီး failure အထိ မလုပ်ပါနဲ့။ Form နဲ့ control ကိုဦးစားပေးပါ။" : "For the first three weeks, follow the prescribed reps and load without training to failure. Prioritise form and control."}</p></div>
          <div className="flex items-center gap-3 rounded-2xl bg-ice px-5 py-4 text-aqua"><MoveUpRight size={20} /><div><strong className="block text-sm">12 sessions</strong><span className="text-[10px]">Phase 1</span></div></div>
        </div>
        <Link href={`/${locale}/app/schedule`} className="flex min-h-15 items-center justify-between bg-sky px-6 text-sm font-bold text-charcoal sm:px-8"><span>{mm ? "အပတ် ၁ အတွက် ရက်ရွေးမယ်" : "Plan Week 1"}</span><ArrowRight size={18} /></Link>
      </section>
    </div>
  );
}
