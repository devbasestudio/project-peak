"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, TimerReset } from "lucide-react";
import { saveBaseline } from "@/app/actions";
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
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0} className="secondary-button min-h-11 px-3 disabled:opacity-30"><ArrowLeft size={17} /></button>
        <span className="mono text-xs text-charcoal/38">{index + 1} / {movements.length}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-charcoal/8"><div className="h-full bg-sky transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>

      <section className="surface mt-5 overflow-hidden">
        <div className="relative min-h-56 bg-charcoal p-6 text-white sm:p-8">
          <p className="eyebrow text-sky">BASELINE · MAX REPS</p>
          <h1 className="mt-6 font-display text-5xl font-bold tracking-[-.055em]">{mm ? movement.name_mm : movement.name_en}</h1>
          <p className="mt-3 text-sm text-white/42">{mm ? movement.equipment_mm : movement.equipment_en}</p>
          <div className="absolute bottom-6 right-6 grid h-14 w-14 place-items-center rounded-full border border-sky/30 bg-sky/10"><span className="mono text-sky">0{index + 1}</span></div>
        </div>

        <div className="p-6 sm:p-8">
          <p className="text-sm leading-7 text-charcoal/55" lang={mm ? "my" : "en"}>{mm ? "Form မပျက်ဘဲ ကိုယ်လုပ်နိုင်သလောက်စမ်းပါ။ တစ်ခုပြီးရင် 3 မိနစ်နားပြီး နောက်တစ်ခုဆက်မယ်" : "Do as many clean reps as you can without breaking form. Rest three minutes before the next movement."}</p>
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-charcoal/10 bg-paper p-4">
            <button type="button" onClick={() => setValues((current) => ({ ...current, [movement.id]: Math.max(0, current[movement.id] - 1) }))} className="grid h-14 w-14 place-items-center rounded-xl border border-charcoal/10 bg-white" aria-label="Decrease reps"><Minus size={20} /></button>
            <div className="text-center"><span className="mono text-6xl font-bold tracking-[-.08em]">{values[movement.id]}</span><p className="eyebrow mt-1 text-charcoal/35">REPS</p></div>
            <button type="button" onClick={() => setValues((current) => ({ ...current, [movement.id]: Math.min(999, current[movement.id] + 1) }))} className="grid h-14 w-14 place-items-center rounded-xl bg-sky" aria-label="Increase reps"><Plus size={20} /></button>
          </div>

          {rest !== null && rest > 0 ? (
            <div className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-charcoal/15 px-4 py-3"><span className="flex items-center gap-2 text-sm font-semibold text-charcoal/55"><TimerReset size={17} />{mm ? "နားချိန်" : "Rest"}</span><button type="button" onClick={() => setRest(0)} className="mono text-lg font-bold text-aqua">{time}</button></div>
          ) : null}

          <button type="button" onClick={next} disabled={saving} className="primary-button mt-6 w-full">{saving ? (mm ? "သိမ်းနေတယ်…" : "Saving…") : index === movements.length - 1 ? (mm ? "Baseline သိမ်းမယ်" : "Save baseline") : (mm ? "နောက်တစ်ခု" : "Next movement")}{index === movements.length - 1 ? <Check size={17} /> : <ArrowRight size={17} />}</button>
        </div>
      </section>
    </div>
  );
}
