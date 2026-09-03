import Link from "next/link";
import { ArrowRight, BookOpen, Check, Clock3, Dumbbell, FileText, Play } from "lucide-react";
import { FixedGuideScreen } from "@/components/app-shell/fixed-guide-screen";
import type { Locale } from "@/lib/i18n";

export type SessionLearningAsset = {
  id: string;
  assetId: string;
  kind: "video" | "pdf";
  title: string;
  durationSeconds: number | null;
};

export function SessionCompleteView({
  locale,
  dayNumber,
  dayType,
  title,
  exerciseCount,
  setCount,
  durationMinutes,
  assets,
}: {
  locale: Locale;
  dayNumber: number;
  dayType: string;
  title: string;
  exerciseCount: number;
  setCount: number;
  durationMinutes: number;
  assets: SessionLearningAsset[];
}) {
  const mm = locale === "mm";

  return (
    <div className="mx-auto max-w-4xl">
      <section className="relative overflow-hidden rounded-3xl bg-charcoal px-6 py-8 text-white shadow-[0_24px_70px_rgba(6,17,26,.18)] sm:px-9 sm:py-10">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky/20 blur-3xl" />
        <span className="relative grid h-12 w-12 place-items-center rounded-full bg-sky text-charcoal"><Check size={23} strokeWidth={3} /></span>
        <p className="relative mt-12 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-sky">SESSION {String(dayNumber).padStart(2, "0")} · COMPLETE</p>
        <h1 className="relative mt-3 max-w-3xl font-display text-4xl font-black leading-tight tracking-[-.05em] sm:text-6xl" lang={mm ? "my" : "en"}>
          {mm ? "ဒီနေ့လုပ်စရာ ပြီးပါပြီ။" : "Today’s work is done."}
        </h1>
        <p className="relative mt-4 max-w-2xl text-sm leading-7 text-white/58" lang={mm ? "my" : "en"}>{title} · {dayType.toUpperCase()}</p>

        <div className="relative mt-8 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/12 bg-white/[.04]">
          <Metric icon={Dumbbell} value={String(exerciseCount)} label={mm ? "လေ့ကျင့်ခန်း" : "Exercises"} />
          <Metric icon={Check} value={String(setCount)} label={mm ? "ပြီးခဲ့တဲ့ Sets" : "Sets logged"} />
          <Metric icon={Clock3} value={`${durationMinutes}m`} label={mm ? "ကြာချိန်" : "Duration"} />
        </div>
      </section>

      {assets.length ? (
        <section className="mt-5 overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
          <header className="flex items-center gap-3 border-b border-charcoal/8 px-5 py-4 sm:px-6">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ice text-aqua"><BookOpen size={18} /></span>
            <div><h2 className="text-base font-bold">{mm ? "ဒီနေ့အတွက် သိထားရမယ့်အချက်" : "Today’s learning"}</h2><p className="mt-1 text-xs text-charcoal/42">{mm ? "Workout ပြီးချိန်မှာ တစ်ချက်ကြည့်ထားပါ" : "A short lesson to lock in after training"}</p></div>
          </header>
          <div className="grid gap-4 p-5 sm:p-6">
            {assets.map((asset) => asset.kind === "video" ? (
              <article key={asset.id} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-charcoal text-white">
                <video controls preload="none" playsInline className="aspect-video w-full bg-black" src={`/api/member-media/${asset.assetId}`} />
                <div className="flex items-center justify-between gap-4 px-4 py-3"><span className="flex items-center gap-2 text-sm font-semibold"><Play size={15} />{asset.title}</span>{asset.durationSeconds ? <span className="font-mono text-[10px] text-white/40">{Math.ceil(asset.durationSeconds / 60)} MIN</span> : null}</div>
              </article>
            ) : (
              <a key={asset.id} href={`/api/member-media/${asset.assetId}`} target="_blank" rel="noreferrer" className="flex min-h-14 items-center gap-3 rounded-xl border border-charcoal/10 bg-[#f4f6f5] px-4 text-sm font-semibold"><FileText className="text-aqua" size={19} /><span className="flex-1">{asset.title}</span><ArrowRight size={16} /></a>
            ))}
          </div>
        </section>
      ) : null}

      <Link href={`/${locale}/app`} className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-sky px-5 text-sm font-bold text-charcoal">
        {mm ? "ဒီနေ့စာမျက်နှာ ပြန်သွားမယ်" : "Back to today"}<ArrowRight size={17} />
      </Link>

      {dayNumber === 12 ? <div className="mt-6"><FixedGuideScreen locale={locale} variant="phase2" /></div> : null}
    </div>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof Dumbbell; value: string; label: string }) {
  return <div className="min-w-0 border-r border-white/10 px-3 py-4 last:border-r-0 sm:px-5"><Icon className="text-sky" size={16} /><strong className="mt-3 block truncate font-mono text-xl font-black sm:text-2xl">{value}</strong><span className="mt-1 block text-[9px] font-semibold uppercase tracking-wider text-white/38">{label}</span></div>;
}
