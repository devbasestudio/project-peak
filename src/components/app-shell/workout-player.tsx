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
  exercise: { id: string; name_mm: string; name_en: string; cue_mm: string | null; cue_en: string | null; unilateral: boolean };
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
  const sheetRef = useRef<HTMLDivElement>(null);
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
    supabase.from("workout_sessions").upsert({ id: sessionId, program_id: programId, day_number: dayNumber, session_type: dayType.toLowerCase(), status: "in_progress", local_date: localDate, started_at: new Date().toISOString() }, { onConflict: "program_id,day_number" }).then(() => undefined);
    const onOnline = async () => { setOnline(true); const result = await flushQueue(supabase); if (result.synced) toast.success(mm ? `${result.synced} ခု sync ပြီးပြီ` : `${result.synced} offline logs synced`); };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, [dayNumber, dayType, mm, programId, sessionId]);

  useEffect(() => {
    if (!running || rest <= 0) return;
    const timer = window.setInterval(() => setRest((value) => {
      if (value <= 1) { setRunning(false); if (navigator.vibrate) navigator.vibrate([120, 80, 120]); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [rest, running]);

  useEffect(() => {
    if (sheetRef.current) gsap.fromTo(sheetRef.current, { autoAlpha: 0, x: 18 }, { autoAlpha: 1, x: 0, duration: 0.32, ease: "power3.out" });
  }, [activeIndex]);

  const restLabel = useMemo(() => `${String(Math.floor(rest / 60)).padStart(2, "0")}:${String(rest % 60).padStart(2, "0")}`, [rest]);
  const updateSet = useCallback((setIndex: number, patch: Partial<SetValue>) => {
    setValues((current) => ({ ...current, [active.id]: current[active.id].map((value, index) => index === setIndex ? { ...value, ...patch } : value) }));
  }, [active]);

  async function completeSet(setIndex: number) {
    const setValue = activeSets[setIndex];
    const mutationId = crypto.randomUUID();
    const payload = { id: mutationId, session_id: sessionId, program_id: programId, program_day_item_id: active.id, set_index: setIndex + 1, weight_kg: setValue.weight, reps: setValue.reps, mutation_id: mutationId, local_time: new Date().toLocaleTimeString("en-GB", { hour12: false }) };
    updateSet(setIndex, { done: true, synced: false });
    await enqueueMutation({ id: mutationId, table: "set_logs", payload });
    if (navigator.onLine) {
      const supabase = createClient();
      const { error } = await supabase.from("set_logs").upsert(payload, { onConflict: "session_id,program_day_item_id,set_index" });
      if (!error) { updateSet(setIndex, { synced: true }); await flushQueue(supabase); }
    }
    setRest(active.rest_seconds);
    setRunning(true);
    if (sheetRef.current) gsap.fromTo(sheetRef.current.querySelector(`[data-set='${setIndex}']`), { backgroundColor: "rgba(5,171,221,.34)" }, { backgroundColor: "rgba(255,255,255,1)", duration: 0.55, ease: "power2.out" });
  }

  async function finishWorkout() {
    setFinishing(true);
    try {
      if (!navigator.onLine) { toast.error(mm ? "Session ပြီးဖို့ online ပြန်ရောက်ဖို့လိုတယ်" : "Reconnect to finish the session", { description: mm ? "Sets တွေကို device မှာသိမ်းထားတယ်" : "Your sets are safely queued on this device" }); return; }
      const supabase = createClient();
      const queueResult = await flushQueue(supabase);
      if (queueResult.remaining) throw new Error("Some offline logs could not sync yet");
      const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
      const { error } = await supabase.rpc("complete_session", { p_program_id: programId, p_day_number: dayNumber, p_local_date: localDate, p_mutation_id: crypto.randomUUID() });
      if (error) throw error;
      toast.success(mm ? "Session ပြီးပြီ 💪" : "Session complete 💪");
      router.push(`/${locale}/app?completed=${dayNumber}`);
      router.refresh();
    } catch (error) { toast.error(mm ? "Session ကို finish မလုပ်နိုင်သေးဘူး" : "Could not finish this session", { description: error instanceof Error ? error.message : undefined }); }
    finally { setFinishing(false); }
  }

  if (!active) return null;
  const activeDone = activeSets.filter((set) => set.done).length;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="grid gap-5 border-b-2 border-charcoal pb-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div><p className="eyebrow text-charcoal/38">PHASE {phase} · LIVE TRAINING LOG</p><div className="mt-3 flex items-baseline gap-4"><h1 className="font-display text-5xl font-bold tracking-[-.07em] sm:text-7xl">SESSION {String(dayNumber).padStart(2, "0")}</h1><span className="hidden border-l border-charcoal/20 pl-4 text-sm font-bold sm:block">{dayType}</span></div></div>
        <div className="flex items-center gap-4"><span className={`flex items-center gap-2 text-[10px] font-bold ${online ? "text-charcoal" : "text-charcoal/38"}`}>{online ? <Wifi size={14} className="text-sky" /> : <WifiOff size={14} />}{online ? "ONLINE" : "OFFLINE · SAVING"}</span><span className="mono text-xs font-bold">{completedSets}/{totalSets} SETS</span></div>
      </header>

      <div className="h-1 bg-charcoal/10"><div className="h-full bg-sky transition-[width]" style={{ width: `${(completedSets / totalSets) * 100}%` }} /></div>
      <nav aria-label="Exercises" className="grid grid-cols-2 border-b border-charcoal/15 bg-white sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item, itemIndex) => {
          const count = values[item.id].filter((set) => set.done).length;
          const selected = itemIndex === activeIndex;
          return <button key={item.id} type="button" onClick={() => setActiveIndex(itemIndex)} className={`relative min-h-20 border-r border-b border-charcoal/10 px-3 py-3 text-left lg:border-b-0 ${selected ? "bg-sky" : "hover:bg-paper"}`}><span className="mono text-[9px] font-bold text-charcoal/35">{String(itemIndex + 1).padStart(2, "0")}</span><span className="mt-1 block truncate text-xs font-bold">{mm ? item.exercise.name_mm : item.exercise.name_en}</span><span className="mono mt-1 block text-[8px] text-charcoal/35">{count}/{item.sets} SETS</span>{count === item.sets ? <Check className="absolute right-2 top-2" size={13} /> : null}</button>;
        })}
      </nav>

      <section ref={sheetRef} className="grid border-b border-charcoal/20 bg-white lg:grid-cols-[1fr_300px]">
        <div>
          <header className="relative overflow-hidden border-b border-charcoal/15 p-6 sm:p-9"><span aria-hidden className="absolute bottom-0 left-0 top-0 w-2 bg-sky" /><div className="flex items-start justify-between gap-5"><div><p className="mono text-[9px] font-bold tracking-[.2em] text-charcoal/35">EXERCISE {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}</p><h2 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[.9] tracking-[-.06em] sm:text-6xl">{mm ? active.exercise.name_mm : active.exercise.name_en}</h2></div><span className="mono text-xs font-bold">{activeDone}/{active.sets}</span></div><p className="mt-5 max-w-2xl text-sm leading-7 text-charcoal/56" lang={mm ? "my" : "en"}>{mm ? active.exercise.cue_mm : active.exercise.cue_en}</p>{active.exercise.unilateral ? <p className="mt-3 border-l-2 border-sky pl-3 text-xs font-bold">{mm ? "ဘယ်/ညာ နှစ်ဖက် = 1 set" : "Both sides = one set"}</p> : null}</header>

          <div className="border-t border-charcoal/8">
            <div className="hidden grid-cols-[72px_1fr_1fr_160px] border-b border-charcoal/12 bg-paper px-4 py-3 text-[9px] font-bold uppercase tracking-[.18em] text-charcoal/35 sm:grid"><span>Set</span><span>Load</span><span>Reps</span><span>Status</span></div>
            {activeSets.map((setValue, setIndex) => <div key={setIndex} data-set={setIndex} className={`grid gap-3 border-b border-charcoal/12 p-4 sm:grid-cols-[56px_1fr_1fr_160px] sm:items-center ${setValue.done ? "bg-sky/[.07]" : "bg-white"}`}><div className="flex items-center justify-between sm:block"><span className="font-display text-3xl font-bold">{String(setIndex + 1).padStart(2, "0")}</span><span className="mono text-[8px] font-bold text-charcoal/32 sm:hidden">SET</span></div><Stepper label="KG" value={setValue.weight} step={0.5} onChange={(value) => updateSet(setIndex, { weight: value, done: false })} /><Stepper label="REPS" value={setValue.reps} step={1} onChange={(value) => updateSet(setIndex, { reps: value, done: false })} /><button type="button" onClick={() => completeSet(setIndex)} className={`flex min-h-12 items-center justify-between border px-4 text-xs font-bold ${setValue.done ? "border-charcoal/15 bg-white" : "border-charcoal bg-sky"}`}><span>{setValue.done ? (setValue.synced ? "SYNCED" : "SAVED OFFLINE") : `${active.reps_min}—${active.reps_max} · LOG`}</span><Check size={15} /></button></div>)}
          </div>
        </div>

        <aside className="border-t border-charcoal/15 bg-paper p-6 lg:border-l lg:border-t-0 lg:p-7">
          <p className="eyebrow text-charcoal/35">CURRENT PRESCRIPTION</p><div className="mt-6 divide-y divide-charcoal/12 border-y border-charcoal/12"><Measure label="SETS" value={active.sets} /><Measure label="TARGET" value={`${active.reps_min}—${active.reps_max}`} /><Measure label="REST" value={`${Math.floor(active.rest_seconds / 60)}:${String(active.rest_seconds % 60).padStart(2, "0")}`} /></div><div className="mt-8 flex items-center justify-between"><button type="button" onClick={() => setActiveIndex((value) => Math.max(0, value - 1))} disabled={activeIndex === 0} className="grid h-12 w-12 place-items-center border border-charcoal/15 bg-white disabled:opacity-25" aria-label="Previous exercise"><ArrowLeft size={17} /></button><span className="mono text-[9px] text-charcoal/35">{activeIndex + 1} / {items.length}</span><button type="button" onClick={() => setActiveIndex((value) => Math.min(items.length - 1, value + 1))} disabled={activeIndex === items.length - 1} className="grid h-12 w-12 place-items-center border border-charcoal/15 bg-white disabled:opacity-25" aria-label="Next exercise"><ArrowRight size={17} /></button></div>
        </aside>
      </section>

      <div className="sticky bottom-20 z-20 mt-4 grid border-2 border-charcoal bg-charcoal text-white shadow-[0_-12px_40px_rgba(6,17,26,.12)] sm:grid-cols-[1fr_auto] lg:bottom-4">
        <div className="flex items-center gap-4 p-3 sm:px-5"><button type="button" onClick={() => setRunning((value) => !value)} className="grid h-12 w-12 place-items-center bg-sky text-charcoal">{running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button><div><p className="mono text-[8px] font-bold tracking-[.18em] text-white/38">REST TIMER</p><p aria-live="polite" className="mono text-2xl font-bold">{restLabel}</p></div><button type="button" onClick={() => { setRest(active.rest_seconds); setRunning(false); }} className="ml-auto grid h-10 w-10 place-items-center text-white/40" aria-label="Reset rest timer"><RotateCcw size={17} /></button></div>
        {completedSets === totalSets ? <button type="button" disabled={finishing} onClick={finishWorkout} className="flex min-h-16 items-center justify-between border-t border-white/15 bg-sky px-5 text-sm font-bold text-charcoal sm:min-w-64 sm:border-l sm:border-t-0"><span>{finishing ? (mm ? "Finish လုပ်နေတယ်…" : "Finishing…") : (mm ? "Session finish" : "Finish session")}</span><Check size={18} /></button> : <div className="hidden min-w-64 items-center justify-center border-l border-white/12 px-5 text-[10px] font-bold uppercase tracking-[.15em] text-white/35 sm:flex">{totalSets - completedSets} sets remaining</div>}
      </div>
    </div>
  );
}

function Stepper({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (value: number) => void }) {
  return <div className="grid grid-cols-[44px_1fr_44px] border border-charcoal/12 bg-paper"><button type="button" onClick={() => onChange(Math.max(0, value - step))} className="grid min-h-11 place-items-center border-r border-charcoal/12 bg-white" aria-label={`Decrease ${label}`}><Minus size={15} /></button><div className="grid place-items-center"><span className="mono text-lg font-bold">{Number.isInteger(value) ? value : value.toFixed(1)}</span><span className="mono text-[7px] font-bold tracking-[.12em] text-charcoal/30">{label}</span></div><button type="button" onClick={() => onChange(value + step)} className="grid min-h-11 place-items-center border-l border-charcoal/12 bg-white" aria-label={`Increase ${label}`}><Plus size={15} /></button></div>;
}

function Measure({ label, value }: { label: string; value: string | number }) { return <div className="flex items-center justify-between py-3"><span className="mono text-[9px] font-bold tracking-[.14em] text-charcoal/35">{label}</span><span className="mono text-lg font-bold">{value}</span></div>; }
