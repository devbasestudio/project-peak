"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, TimerReset } from "lucide-react";
import { toast } from "sonner";
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
    try {
      await saveBaseline(programId, movements.map((item) => ({ movementId: item.id, value: values[item.id] ?? 0 })), locale);
    } catch (error) {
      toast.error(mm ? "Baseline ကို မသိမ်းနိုင်သေးပါ" : "Could not save your baseline", {
        description: mm ? "Internet connection စစ်ပြီး ထပ်နှိပ်ပါ။ ထည့်ထားတဲ့အကြိမ်ရေ မပျောက်ပါဘူး။" : "Check your connection and try again. Your entered reps are still here.",
      });
      setSaving(false);
      console.error(error);
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-4xl">
      <header className="mb-6">
        <p className="text-xs font-semibold text-sky">{mm ? "စတင်မယ့်အခြေအနေ · ၄ ခု" : "Starting point · 4 movements"}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-.04em] sm:text-4xl" lang={mm ? "my" : "en"}>{mm ? "လက်ရှိအားကို မှတ်ထားမယ်" : "Record your starting point"}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/55" lang={mm ? "my" : "en"}>{mm ? "လှုပ်ရှားမှုတစ်ခုစီကို Form မှန်မှန်နဲ့ အများဆုံးလုပ်ပြီး ရတဲ့အကြိမ်ကို မှတ်ပါ။" : "Use clean form, do your honest maximum, and record the reps for each movement."}</p>
      </header>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Baseline movements">
        {movements.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setIndex(itemIndex)}
            className={`flex min-h-11 min-w-24 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition ${itemIndex === index ? "bg-charcoal text-white" : itemIndex < index ? "bg-ice text-aqua" : "border border-charcoal/10 bg-white text-charcoal/48"}`}
          >
            {itemIndex < index ? <Check size={14} /> : <span>{itemIndex + 1}</span>}
            <span className="max-w-24 truncate">{mm ? item.name_mm : item.name_en}</span>
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-[0_16px_45px_rgba(6,17,26,.05)]">
        <div className="h-1.5 bg-charcoal/[.06]"><div className="h-full rounded-r-full bg-sky transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
        <div className="grid lg:grid-cols-[1fr_290px]">
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold text-charcoal/38">{mm ? `လှုပ်ရှားမှု ${index + 1} / ${movements.length}` : `Movement ${index + 1} of ${movements.length}`}</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-[-.04em] sm:text-5xl" lang={mm ? "my" : "en"}>{mm ? movement.name_mm : movement.name_en}</h2>
            <p className="mt-2 text-sm text-charcoal/45">{mm ? movement.equipment_mm : movement.equipment_en}</p>
            <div className="mt-7 rounded-xl bg-[#f4f6f5] p-4 text-sm leading-7 text-charcoal/58" lang={mm ? "my" : "en"}>{mm ? "Form မပျက်ခင်အထိ လုပ်ပါ။ ပြီးရင် အောက်မှာ အကြိမ်ရေကို ထည့်ပြီး ဆက်သွားပါ။" : "Stop before your form breaks. Enter the reps, then continue."}</div>
          </div>

          <aside className="border-t border-charcoal/8 bg-[#fafbfa] p-6 lg:border-l lg:border-t-0">
            <p className="text-center text-xs font-semibold text-charcoal/42">{mm ? "ရရှိတဲ့အကြိမ်" : "Reps completed"}</p>
            <div className="mt-4 flex items-center justify-center gap-4">
              <button type="button" onClick={() => setValues((current) => ({ ...current, [movement.id]: Math.max(0, current[movement.id] - 1) }))} className="grid h-12 w-12 place-items-center rounded-xl border border-charcoal/10 bg-white" aria-label="Decrease reps"><Minus size={20} /></button>
              <span aria-live="polite" className="mono min-w-24 text-center text-5xl font-bold tracking-[-.05em]">{values[movement.id]}</span>
              <button type="button" onClick={() => setValues((current) => ({ ...current, [movement.id]: Math.min(999, current[movement.id] + 1) }))} className="grid h-12 w-12 place-items-center rounded-xl bg-sky" aria-label="Increase reps"><Plus size={20} /></button>
            </div>

            {rest !== null && rest > 0 ? (
              <div className="mt-5 flex items-center justify-between rounded-xl bg-ice px-4 py-3">
                <span className="flex items-center gap-2 text-xs font-semibold"><TimerReset size={16} />{mm ? "နားချိန်" : "Rest"}</span>
                <button type="button" onClick={() => setRest(0)} className="mono text-lg font-bold">{time}</button>
              </div>
            ) : null}

            <button type="button" onClick={next} disabled={saving} className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-charcoal px-5 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? (mm ? "သိမ်းနေပါတယ်…" : "Saving…") : index === movements.length - 1 ? (mm ? "Baseline သိမ်းမယ်" : "Save baseline") : (mm ? "နောက်တစ်ခု ဆက်မယ်" : "Next movement")}
              {index === movements.length - 1 ? <Check size={17} /> : <ArrowRight size={17} />}
            </button>
            {index > 0 ? <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 text-xs font-semibold text-charcoal/45"><ArrowLeft size={14} />{mm ? "အရင်တစ်ခု" : "Previous"}</button> : null}
          </aside>
        </div>
      </section>
    </div>
  );
}
