import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarClock, Droplets, Moon, Utensils } from "lucide-react";
import { AscentMark } from "@/components/app-shell/ascent-mark";
import type { Locale } from "@/lib/i18n";

export function RestDayView({ locale, nextDay, nextType, nextTitle, scheduledDate }: { locale: Locale; nextDay: number; nextType: string; nextTitle: string; scheduledDate: string }) {
  const mm = locale === "mm";
  const date = new Intl.DateTimeFormat(mm ? "my-MM" : "en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${scheduledDate}T12:00:00`));
  return (
    <div className="mx-auto max-w-4xl">
      <section className="relative overflow-hidden rounded-3xl bg-charcoal px-6 py-8 text-white sm:px-10 sm:py-12">
        <AscentMark className="absolute -right-20 -top-10 h-72 w-[28rem] text-sky/15" />
        <p className="relative font-mono text-[10px] font-bold uppercase tracking-[.22em] text-sky">RECOVERY DAY</p>
        <div className="relative mt-10 grid gap-8 sm:grid-cols-[1fr_240px] sm:items-end">
          <div><Moon className="text-sky" size={34} /><h1 className="mt-5 font-display text-5xl font-black leading-[.9] tracking-[-.06em] sm:text-7xl" lang={mm ? "my" : "en"}>{mm ? "ဒီနေ့ နားရက်ပါ။" : "Today is for recovery."}</h1><p className="mt-5 max-w-xl text-sm leading-7 text-white/58" lang={mm ? "my" : "en"}>{mm ? "နောက် Session ကို ပိုကောင်းကောင်းလုပ်နိုင်ဖို့ ဒီနေ့ ကိုယ်ခန္ဓာကို အနားပေးပါ။ နားတာလည်း Program ရဲ့ အစိတ်အပိုင်းတစ်ခုပါ။" : "Give your body room to recover so the next session can be better. Recovery is part of the program."}</p></div>
          <div className="rounded-2xl border border-white/12 bg-white/[.06] p-5"><p className="text-[10px] font-bold text-white/38">NEXT · SESSION {nextDay}</p><strong className="mt-3 block text-2xl text-sky">{nextType.toUpperCase()}</strong><p className="mt-2 text-sm font-semibold">{nextTitle}</p><div className="mt-5 flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-white/55"><CalendarClock className="mt-0.5 shrink-0 text-sky" size={16} /><span>{date}</span></div></div>
        </div>
      </section>

      <section className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-charcoal/10 bg-charcoal/10 sm:grid-cols-3">
        <RecoveryItem icon={Utensils} title="Protein" text={mm ? "ကြွက်သားပြန်လည်တည်ဆောက်ဖို့ Protein ကို ဦးစားပေးပါ။" : "Prioritise protein to support recovery."} />
        <RecoveryItem icon={Droplets} title={mm ? "ရေ" : "Water"} text={mm ? "တစ်နေ့လုံး ရေလုံလောက်အောင် သောက်ပါ။" : "Drink enough water through the day."} />
        <RecoveryItem icon={Moon} title={mm ? "အိပ်ချိန်" : "Sleep"} text={mm ? "ဒီည အိပ်ချိန်ကို မလျှော့ပါနဲ့။" : "Protect tonight's sleep."} />
      </section>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><Link href={`/${locale}/app`} className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-charcoal/10 bg-white text-sm font-semibold"><ArrowLeft size={16} />{mm ? "ဒီနေ့စာမျက်နှာ" : "Back to today"}</Link><Link href={`/${locale}/app/habits`} className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-sky text-sm font-bold text-charcoal">{mm ? "ဒီနေ့မှတ်တမ်း ဖြည့်မယ်" : "Log today's basics"}<ArrowRight size={16} /></Link></div>
    </div>
  );
}

function RecoveryItem({ icon: Icon, title, text }: { icon: typeof Moon; title: string; text: string }) {
  return <article className="bg-white p-5 sm:p-6"><span className="grid h-10 w-10 place-items-center rounded-xl bg-ice text-aqua"><Icon size={18} /></span><h2 className="mt-4 text-sm font-bold">{title}</h2><p className="mt-2 text-xs leading-6 text-charcoal/50">{text}</p></article>;
}
