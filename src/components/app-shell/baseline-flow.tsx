"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, TimerReset } from "lucide-react";
import { saveBaseline } from "@/app/actions";
import { AscentMark } from "@/components/app-shell/ascent-mark";
import type { Locale } from "@/lib/i18n";

type Movement = { id: string; name_mm: string; name_en: string; equipment_mm: string | null; equipment_en: string | null };

export function BaselineFlow({ locale, programId, movements }: { locale: Locale; programId: string; movements: Movement[] }) {
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(movements.map((movement) => [movement.id, 0])));
  const [rest, setRest] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const mm = locale === "mm";
  const movement = movements[index];
  const progress = ((index + 1) / movements.length) * 100;

  useEffect(() => {
    if (rest === null || rest <= 0) return;
    const id = window.setInterval(() => setRest((value) => value === null ? null : Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [rest]);

  const time = useMemo(() => {
    const seconds = rest ?? 0;
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }, [rest]);

  if (!movement) return null;

  async function next() {
    if (index < movements.length - 1) {
      setRest(180);
      setIndex((value) => value + 1);
      return;
    }
    setSaving(true);
    await saveBaseline(programId, movements.map((item) => ({ movementId: item.id, value: values[item.id] ?? 0 })), locale);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="grid gap-6 border-b-2 border-charcoal pb-7 lg:grid-cols-[1fr_260px] lg:items-end">
        <div><p className="eyebrow text-charcoal/40">BASE CAMP · DAY ZERO</p><h1 className="mt-4 font-display text-5xl font-bold leading-[.9] tracking-[-.07em] sm:text-7xl">{mm ? "စတင်တဲ့နေရာကို မှတ်မယ်" : "Mark the starting line"}</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-charcoal/55" lang={mm ? "my" : "en"}>{mm ? "Form မပျက်ဘဲ ကိုယ်လုပ်နိုင်သလောက်စမ်းပါ။ ဒီကိန်းဂဏန်းတွေကို Week 12 မှာ ပြန်ယှဉ်မယ်" : "Use clean form and record your honest maximum. These numbers become your Week 12 proof."}</p></div>
        <AscentMark className="hidden w-full text-charcoal lg:block" />
      </header>

      <div className="mt-6 grid grid-cols-4 border-y border-charcoal/15 bg-white">
        {movements.map((item, itemIndex) => <button key={item.id} type="button" onClick={() => setIndex(itemIndex)} className={`relative min-h-16 border-r border-charcoal/12 px-2 py-3 text-left last:border-r-0 ${itemIndex === index ? "bg-sky" : ""}`}><span className="mono block text-[9px] font-bold text-charcoal/35">0{itemIndex + 1}</span><span className="mt-1 hidden truncate text-xs font-bold sm:block">{mm ? item.name_mm : item.name_en}</span>{itemIndex < index ? <Check className="absolute right-2 top-2" size={13} /> : null}</button>)}
      </div>

      <section className="grid border-b border-charcoal/20 bg-white lg:grid-cols-[1fr_360px]">
        <div className="relative min-h-[430px] overflow-hidden p-6 sm:p-10 lg:min-h-[500px]">
          <div aria-hidden className="absolute bottom-0 left-0 h-2 w-full bg-charcoal/8"><div className="h-full bg-sky transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
          <div className="flex h-full flex-col justify-between">
            <div className="flex items-start justify-between"><div><p className="mono text-[10px] font-bold tracking-[.2em] text-charcoal/38">MOVEMENT {String(index + 1).padStart(2, "0")} / {String(movements.length).padStart(2, "0")}</p><h2 className="mt-6 max-w-3xl font-display text-5xl font-bold leading-[.9] tracking-[-.065em] sm:text-7xl">{mm ? movement.name_mm : movement.name_en}</h2><p className="mt-4 text-sm font-bold text-charcoal/42">{mm ? movement.equipment_mm : movement.equipment_en}</p></div><span className="hidden text-[10px] font-bold uppercase tracking-[.18em] text-charcoal/28 [writing-mode:vertical-rl] sm:block">Maximum clean reps</span></div>
            <div className="mt-12 border-t border-charcoal/15 pt-5"><p className="max-w-xl text-sm leading-7 text-charcoal/55" lang={mm ? "my" : "en"}>{mm ? "တစ်ခုပြီးရင် 3 မိနစ်နားပြီး နောက် movement ကိုဆက်မယ်" : "After this movement, rest three minutes before continuing."}</p></div>
          </div>
        </div>

        <aside className="flex flex-col border-t border-charcoal/15 bg-paper lg:border-l lg:border-t-0">
          <div className="border-b border-charcoal/15 p-6 sm:p-8"><p className="eyebrow text-charcoal/35">REPS RECORDED</p><div aria-live="polite" className="mono mt-4 text-[7rem] font-bold leading-none tracking-[-.12em] sm:text-[8.5rem]">{values[movement.id]}</div></div>
          <div className="grid grid-cols-2 border-b border-charcoal/15"><button type="button" onClick={() => setValues((current) => ({ ...current, [movement.id]: Math.max(0, current[movement.id] - 1) }))} className="grid min-h-20 place-items-center border-r border-charcoal/15 bg-white" aria-label="Decrease reps"><Minus size={24} /></button><button type="button" onClick={() => setValues((current) => ({ ...current, [movement.id]: Math.min(999, current[movement.id] + 1) }))} className="grid min-h-20 place-items-center bg-sky" aria-label="Increase reps"><Plus size={24} /></button></div>
          {rest !== null && rest > 0 ? <div className="flex items-center justify-between border-b border-charcoal/15 px-6 py-4"><span className="flex items-center gap-2 text-xs font-bold"><TimerReset size={16} />{mm ? "နားချိန်" : "Rest"}</span><button type="button" onClick={() => setRest(0)} className="mono text-2xl font-bold">{time}</button></div> : null}
          <div className="mt-auto p-6"><button type="button" onClick={next} disabled={saving} className="flex min-h-14 w-full items-center justify-between border-2 border-charcoal bg-charcoal px-5 text-sm font-bold text-white disabled:opacity-50"><span>{saving ? (mm ? "သိမ်းနေတယ်…" : "Saving…") : index === movements.length - 1 ? (mm ? "Baseline သိမ်းမယ်" : "Save baseline") : (mm ? "နောက်တစ်ခု" : "Next movement")}</span>{index === movements.length - 1 ? <Check size={17} /> : <ArrowRight size={17} />}</button>{index > 0 ? <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 text-xs font-bold text-charcoal/45"><ArrowLeft size={14} />{mm ? "နောက်ပြန်" : "Previous"}</button> : null}</div>
        </aside>
      </section>
    </div>
  );
}
