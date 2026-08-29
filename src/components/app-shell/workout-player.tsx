"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Minus, Pause, Play, Plus, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import gsap from "gsap";
import { createClient } from "@/lib/supabase/client";
import { enqueueMutation, flushQueue } from "@/lib/offline/mutation-queue";
import type { Locale } from "@/lib/i18n";

export type WorkoutItem = {
  id: string;
  position: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  target_kg: number;
  rest_seconds: number;
  exercise: {
    id: string;
    name_mm: string;
    name_en: string;
    cue_mm: string | null;
    cue_en: string | null;
    unilateral: boolean;
  };
};

type SetValue = { weight: number; reps: number; done: boolean; synced: boolean };

export function WorkoutPlayer({ locale, programId, dayNumber, dayType, phase, items, existingSessionId, initialLogs }: {
  locale: Locale;
  programId: string;
  dayNumber: number;
  dayType: string;
  phase: number;
  items: WorkoutItem[];
  existingSessionId: string | null;
  initialLogs: Array<{ program_day_item_id: string; set_index: number; weight_kg: number; reps: number }>;
}) {
  const router = useRouter();
  const mm = locale === "mm";
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sessionId] = useState(() => existingSessionId ?? crypto.randomUUID());
  const [rest, setRest] = useState(0);
  const [running, setRunning] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [finishing, setFinishing] = useState(false);
  const [values, setValues] = useState<Record<string, SetValue[]>>(() => Object.fromEntries(items.map((item) => [item.id, Array.from({ length: item.sets }, (_, index) => {
    const log = initialLogs.find((row) => row.program_day_item_id === item.id && row.set_index === index + 1);
    return { weight: log?.weight_kg ?? item.target_kg, reps: log?.reps ?? item.reps_min, done: Boolean(log), synced: Boolean(log) };
  })])));

  const active = items[activeIndex];
  const activeSets = active ? values[active.id] : [];
  const completedSets = Object.values(values).flat().filter((value) => value.done).length;
  const totalSets = Object.values(values).flat().length;

  useEffect(() => {
    const supabase = createClient();
    const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
    supabase.from("workout_sessions").upsert({
      id: sessionId,
      program_id: programId,
      day_number: dayNumber,
      session_type: dayType.toLowerCase(),
      status: "in_progress",
      local_date: localDate,
      started_at: new Date().toISOString(),
    }, { onConflict: "program_id,day_number" }).then(() => undefined);

    const onOnline = async () => {
      setOnline(true);
      const result = await flushQueue(supabase);
      if (result.synced) toast.success(mm ? `${result.synced} ခု sync ပြီးပြီ` : `${result.synced} offline logs synced`);
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [dayNumber, dayType, mm, programId, sessionId]);

  useEffect(() => {
    if (!running || rest <= 0) return;
    const timer = window.setInterval(() => setRest((value) => {
      if (value <= 1) {
        setRunning(false);
        if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [rest, running]);

  useEffect(() => {
    if (cardRef.current) gsap.fromTo(cardRef.current, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" });
  }, [activeIndex]);

  const restLabel = useMemo(() => `${String(Math.floor(rest / 60)).padStart(2, "0")}:${String(rest % 60).padStart(2, "0")}`, [rest]);

  const updateSet = useCallback((setIndex: number, patch: Partial<SetValue>) => {
    setValues((current) => ({ ...current, [active.id]: current[active.id].map((value, index) => index === setIndex ? { ...value, ...patch } : value) }));
  }, [active]);

  async function completeSet(setIndex: number) {
    const setValue = activeSets[setIndex];
    const mutationId = crypto.randomUUID();
    const payload = {
      id: mutationId,
      session_id: sessionId,
      program_id: programId,
      program_day_item_id: active.id,
      set_index: setIndex + 1,
      weight_kg: setValue.weight,
      reps: setValue.reps,
      mutation_id: mutationId,
      local_time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    };
    updateSet(setIndex, { done: true, synced: false });
    await enqueueMutation({ id: mutationId, table: "set_logs", payload });
    if (navigator.onLine) {
      const supabase = createClient();
      const { error } = await supabase.from("set_logs").upsert(payload, { onConflict: "session_id,program_day_item_id,set_index" });
      if (!error) {
        updateSet(setIndex, { synced: true });
        await flushQueue(supabase);
      }
    }
    setRest(active.rest_seconds);
    setRunning(true);
    if (cardRef.current) gsap.fromTo(cardRef.current.querySelector(`[data-set='${setIndex}']`), { scale: 0.96 }, { scale: 1, duration: 0.22, ease: "power2.out" });
  }

  async function finishWorkout() {
    setFinishing(true);
    try {
      if (!navigator.onLine) {
        toast.error(mm ? "Session ပြီးဖို့ online ပြန်ရောက်ဖို့လိုတယ်" : "Reconnect to finish the session", { description: mm ? "Sets တွေကို device မှာသိမ်းထားတယ်" : "Your sets are safely queued on this device" });
        return;
      }
      const supabase = createClient();
      const queueResult = await flushQueue(supabase);
      if (queueResult.remaining) throw new Error("Some offline logs could not sync yet");
      const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
      const { error } = await supabase.rpc("complete_session", { p_program_id: programId, p_day_number: dayNumber, p_local_date: localDate, p_mutation_id: crypto.randomUUID() });
      if (error) throw error;
      toast.success(mm ? "Session ပြီးပြီ 💪" : "Session complete 💪");
      router.push(`/${locale}/app?completed=${dayNumber}`);
      router.refresh();
    } catch (error) {
      toast.error(mm ? "Session ကို finish မလုပ်နိုင်သေးဘူး" : "Could not finish this session", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setFinishing(false);
    }
  }

  if (!active) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <button type="button" onClick={() => setActiveIndex((value) => Math.max(0, value - 1))} disabled={activeIndex === 0} className="secondary-button min-h-11 px-3 disabled:opacity-25"><ArrowLeft size={17} /></button>
        <div className="text-center"><p className="eyebrow text-aqua">DAY {dayNumber} · {dayType}</p><p className="mono mt-1 text-xs text-charcoal/38">{completedSets}/{totalSets} SETS</p></div>
        <button type="button" onClick={() => setActiveIndex((value) => Math.min(items.length - 1, value + 1))} disabled={activeIndex === items.length - 1} className="secondary-button min-h-11 px-3 disabled:opacity-25"><ArrowRight size={17} /></button>
      </div>
      <div className="mb-5 h-1 overflow-hidden rounded-full bg-charcoal/8"><div className="h-full bg-sky transition-[width]" style={{ width: `${(completedSets / totalSets) * 100}%` }} /></div>

      <section ref={cardRef} className="surface overflow-hidden">
        <header className="bg-charcoal p-6 text-white sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div><p className="eyebrow text-sky">EXERCISE {activeIndex + 1} / {items.length}</p><h1 className="mt-5 font-display text-4xl font-bold tracking-[-.05em] sm:text-6xl">{mm ? active.exercise.name_mm : active.exercise.name_en}</h1></div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">Phase {phase}</span>
          </div>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/50" lang={mm ? "my" : "en"}>{mm ? active.exercise.cue_mm : active.exercise.cue_en}</p>
          {active.exercise.unilateral ? <p className="mt-3 text-xs font-semibold text-sky">{mm ? "ဘယ်/ညာ နှစ်ဖက် = 1 set" : "Both sides = one set"}</p> : null}
        </header>

        <div className="space-y-3 p-4 sm:p-6">
          {activeSets.map((setValue, setIndex) => (
            <div key={setIndex} data-set={setIndex} className={`rounded-2xl border p-4 transition ${setValue.done ? "border-sky/30 bg-ice/65" : "border-charcoal/10 bg-white"}`}>
              <div className="mb-4 flex items-center justify-between"><p className="eyebrow text-charcoal/38">SET {setIndex + 1}</p><span className={`text-[10px] font-bold uppercase tracking-wider ${setValue.done ? "text-aqua" : "text-charcoal/28"}`}>{setValue.done ? (setValue.synced ? "SYNCED" : "SAVED OFFLINE") : `${active.reps_min}—${active.reps_max} REPS`}</span></div>
              <div className="grid grid-cols-2 gap-3">
                <Stepper label="KG" value={setValue.weight} step={0.5} onChange={(value) => updateSet(setIndex, { weight: value, done: false })} />
                <Stepper label="REPS" value={setValue.reps} step={1} onChange={(value) => updateSet(setIndex, { reps: value, done: false })} />
              </div>
              <button type="button" onClick={() => completeSet(setIndex)} className={`mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl font-bold ${setValue.done ? "border border-sky/30 text-aqua" : "bg-sky text-charcoal"}`}><Check size={17} />{setValue.done ? (mm ? "ပြင်ပြီးပြန်မှတ်မယ်" : "Update set") : (mm ? "Set မှတ်မယ်" : "Log set")}</button>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky bottom-24 mt-4 flex items-center justify-between rounded-2xl border border-charcoal/10 bg-charcoal px-4 py-3 text-white shadow-xl lg:bottom-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setRunning((value) => !value)} className="grid h-11 w-11 place-items-center rounded-full bg-sky text-charcoal">{running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
          <div><p className="eyebrow text-white/35">REST</p><p className="mono text-xl font-bold">{restLabel}</p></div>
          <button type="button" onClick={() => { setRest(active.rest_seconds); setRunning(false); }} className="text-white/35"><RotateCcw size={17} /></button>
        </div>
        <span className={`flex items-center gap-1.5 text-[10px] font-bold ${online ? "text-sky" : "text-white/38"}`}>{online ? <Wifi size={14} /> : <WifiOff size={14} />}{online ? "ONLINE" : "OFFLINE"}</span>
      </div>

      {completedSets === totalSets ? <button type="button" disabled={finishing} onClick={finishWorkout} className="primary-button mt-5 w-full min-h-14">{finishing ? (mm ? "Finish လုပ်နေတယ်…" : "Finishing…") : (mm ? "Session ကို finish လုပ်မယ်" : "Finish session")}<Check size={18} /></button> : null}
    </div>
  );
}

function Stepper({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-xl border border-charcoal/8 bg-paper p-3">
      <p className="eyebrow text-center text-charcoal/32">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - step))} className="grid h-11 w-11 place-items-center rounded-lg border border-charcoal/10 bg-white" aria-label={`Decrease ${label}`}><Minus size={16} /></button>
        <span className="mono text-xl font-bold">{Number.isInteger(value) ? value : value.toFixed(1)}</span>
        <button type="button" onClick={() => onChange(value + step)} className="grid h-11 w-11 place-items-center rounded-lg border border-charcoal/10 bg-white" aria-label={`Increase ${label}`}><Plus size={16} /></button>
      </div>
    </div>
  );
}
