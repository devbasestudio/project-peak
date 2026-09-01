"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, Minus, Pause, Play, Plus, Video, WifiOff } from "lucide-react";
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
    equipment_mm: string | null;
    equipment_en: string | null;
    kg_increment: number;
    unilateral: boolean;
    videos: Array<{
      id: string;
      position: number;
      role: "primary" | "alternative";
      title_mm: string;
      title_en: string;
      cue_mm: string | null;
      cue_en: string | null;
      url: string;
    }>;
  };
};

type SetValue = { weight: number; reps: number; done: boolean };

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
    return { weight: log?.weight_kg ?? item.target_kg, reps: log?.reps ?? item.reps_min, done: Boolean(log) };
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
    updateSet(setIndex, { done: true });
    await enqueueMutation({ id: mutationId, table: "set_logs", payload });
    if (navigator.onLine) {
      const supabase = createClient();
      const { error } = await supabase.from("set_logs").upsert(payload, { onConflict: "session_id,program_day_item_id,set_index" });
      if (!error) await flushQueue(supabase);
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
  const activeUsesLoad = active.target_kg > 0 || active.exercise.kg_increment > 0;
  const activeRemaining = active.sets - activeDone;
  const progress = Math.round((completedSets / totalSets) * 100);
  const targetReps = active.reps_min === active.reps_max ? String(active.reps_min) : `${active.reps_min}–${active.reps_max}`;
  const equipment = mm ? active.exercise.equipment_mm : active.exercise.equipment_en;

  function continueWorkout() {
    const afterCurrent = items.findIndex((item, index) => index > activeIndex && values[item.id].some((set) => !set.done));
    const firstIncomplete = items.findIndex((item) => values[item.id].some((set) => !set.done));
    setActiveIndex(afterCurrent >= 0 ? afterCurrent : Math.max(0, firstIncomplete));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="grid gap-5 sm:grid-cols-[1fr_210px] sm:items-end">
        <div>
          <p className="text-xs font-semibold text-sky">{mm ? `အဆင့် ${phase} · ${dayType} နေ့` : `Phase ${phase} · ${dayType} day`}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-.04em] sm:text-5xl" lang={mm ? "my" : "en"}>{mm ? `ဒီနေ့ လေ့ကျင့်ခန်း ${dayNumber}` : `Workout ${dayNumber}`}</h1>
          <p className="mt-2 text-sm leading-6 text-charcoal/52" lang={mm ? "my" : "en"}>{mm ? "Video ကိုကြည့်ပါ၊ သတ်မှတ်ထားတဲ့အကြိမ်ရေ လုပ်ပါ၊ ပြီးရင် button တစ်ချက်နှိပ်ပါ။" : "Watch the video, complete the reps, then tap one button."}</p>
        </div>
        <div className="rounded-xl border border-charcoal/10 bg-white p-4">
          <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold text-charcoal/42">{mm ? "ဒီနေ့ပြီးစီးမှု" : "TODAY'S PROGRESS"}</span><strong className="text-sm">{progress}%</strong></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-charcoal/[.07]"><div className="h-full rounded-full bg-sky transition-[width]" style={{ width: `${progress}%` }} /></div>
          <p className="mt-2 text-[10px] text-charcoal/42" lang={mm ? "my" : "en"}>{mm ? `Set ${completedSets} ခု ပြီး · ${totalSets - completedSets} ခု ကျန်` : `${completedSets} sets done · ${totalSets - completedSets} left`}</p>
        </div>
      </header>

      {!online ? <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#fff5d8] px-4 py-3 text-xs leading-5 text-[#76560f]"><WifiOff className="mt-0.5 shrink-0" size={16} /><span lang={mm ? "my" : "en"}>{mm ? "Internet မရှိသေးပေမယ့် မှတ်တမ်းကို ဒီဖုန်းထဲမှာ သိမ်းထားပေးပါတယ်။" : "You are offline. Your progress is still saved on this device."}</span></div> : null}

      <nav aria-label={mm ? "လေ့ကျင့်ခန်းများ" : "Exercises"} className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {items.map((item, itemIndex) => {
          const count = values[item.id].filter((set) => set.done).length;
          const selected = itemIndex === activeIndex;
          return <button key={item.id} type="button" onClick={() => setActiveIndex(itemIndex)} className={`relative min-h-18 min-w-40 rounded-xl border px-4 py-3 text-left transition ${selected ? "border-charcoal bg-charcoal text-white shadow-lg" : "border-charcoal/10 bg-white hover:border-charcoal/25"}`}><span className={`text-[9px] font-semibold ${selected ? "text-sky" : "text-charcoal/38"}`}>{mm ? `လေ့ကျင့်ခန်း ${itemIndex + 1} · ${count}/${item.sets} ပြီး` : `Exercise ${itemIndex + 1} · ${count}/${item.sets} done`}</span><span className="mt-1.5 block truncate text-xs font-semibold">{mm ? item.exercise.name_mm : item.exercise.name_en}</span>{count === item.sets ? <CheckCircle2 className="absolute right-3 top-3 text-sky" size={15} /> : null}</button>;
        })}
      </nav>

      <section ref={sheetRef} className="mt-2 overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-[0_16px_45px_rgba(6,17,26,.05)]">
        <ExerciseVideoCarousel key={active.exercise.id} locale={locale} videos={active.exercise.videos} />

        <header className="border-b border-charcoal/8 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold text-sky">{mm ? `လေ့ကျင့်ခန်း ${activeIndex + 1} / ${items.length}` : `Exercise ${activeIndex + 1} of ${items.length}`}</p>
              <h2 className="mt-2 max-w-3xl font-display text-3xl font-bold tracking-[-.04em] sm:text-5xl" lang={mm ? "my" : "en"}>{mm ? active.exercise.name_mm : active.exercise.name_en}</h2>
            </div>
            <span className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${activeDone === active.sets ? "bg-aqua text-white" : "bg-ice text-aqua"}`}><Check size={14} />{mm ? `${activeDone}/${active.sets} Sets ပြီး` : `${activeDone}/${active.sets} sets done`}</span>
          </div>
          {(mm ? active.exercise.cue_mm : active.exercise.cue_en) ? <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/58" lang={mm ? "my" : "en"}>{mm ? active.exercise.cue_mm : active.exercise.cue_en}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-lg bg-charcoal px-3 py-2 text-white">{active.sets} {mm ? "Sets" : "sets"}</span>
            <span className="rounded-lg bg-ice px-3 py-2 text-aqua">{targetReps} {mm ? "ကြိမ်" : "reps"}</span>
            <span className="rounded-lg bg-[#f1f3f2] px-3 py-2 text-charcoal/65">{active.rest_seconds} {mm ? "စက္ကန့် နားမယ်" : "sec rest"}</span>
            {equipment ? <span className="rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-charcoal/55">{equipment}</span> : null}
          </div>
          {active.exercise.unilateral ? <p className="mt-3 rounded-lg bg-[#fff5d8] px-3 py-2 text-xs font-semibold text-[#76560f]" lang={mm ? "my" : "en"}>{mm ? "ဘယ်ဘက်နဲ့ ညာဘက် နှစ်ဖက်လုံးလုပ်ပြီးမှ 1 Set ပြီးပါတယ်။" : "Complete both left and right sides for one set."}</p> : null}
        </header>

        <div className="bg-[#f4f6f5] p-4 sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><h3 className="text-base font-bold" lang={mm ? "my" : "en"}>{mm ? "Set တစ်ခုချင်းစီ မှတ်မယ်" : "Complete each set"}</h3><p className="mt-1 text-xs text-charcoal/45" lang={mm ? "my" : "en"}>{mm ? "Reps ပြင်ချင်ရင် − / + ကိုနှိပ်ပါ။ ပြီးရင် ညာဘက် button ကိုနှိပ်ပါ။" : "Adjust the reps if needed, then mark the set done."}</p></div>
            <span className="shrink-0 text-xs font-semibold text-charcoal/45">{activeRemaining} {mm ? "Sets ကျန်" : "left"}</span>
          </div>
          <div className="space-y-3">
            {activeSets.map((setValue, setIndex) => (
              <article key={setIndex} data-set={setIndex} className={`rounded-xl border p-4 transition sm:p-5 ${setValue.done ? "border-sky/35 bg-ice/65" : "border-charcoal/10 bg-white"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-lg text-sm font-bold ${setValue.done ? "bg-aqua text-white" : "bg-charcoal text-white"}`}>{setIndex + 1}</span><div><p className="text-sm font-bold">Set {setIndex + 1}</p><p className="mt-0.5 text-[10px] text-charcoal/42" lang={mm ? "my" : "en"}>{setValue.done ? (mm ? "ပြီးပါပြီ · ပြင်ချင်ရင် − / + နှိပ်ပါ" : "Done · use − / + to edit") : (mm ? `${targetReps} ကြိမ်လုပ်ပါ` : `Complete ${targetReps} reps`)}</p></div></div>
                  {setValue.done ? <span className="flex items-center gap-1.5 text-xs font-bold text-aqua"><CheckCircle2 size={17} />{mm ? "ပြီးပြီ" : "Done"}</span> : null}
                </div>
                <div className={`mt-4 grid gap-3 ${activeUsesLoad ? "sm:grid-cols-[1fr_1fr_190px]" : "sm:grid-cols-[1fr_190px]"}`}>
                  {activeUsesLoad ? <ValueControl label={mm ? "အလေးချိန်" : "Weight"} suffix="KG" value={setValue.weight} step={0.5} onChange={(value) => updateSet(setIndex, { weight: value, done: false })} /> : null}
                  <ValueControl label={mm ? "အကြိမ်ရေ" : "Reps"} suffix={mm ? "ကြိမ်" : "REPS"} value={setValue.reps} step={1} onChange={(value) => updateSet(setIndex, { reps: value, done: false })} />
                  <button type="button" disabled={setValue.done} onClick={() => completeSet(setIndex)} className={`flex min-h-14 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition ${setValue.done ? "cursor-default bg-white text-aqua ring-1 ring-sky/25" : "bg-sky text-charcoal hover:bg-charcoal hover:text-white"}`}><CheckCircle2 size={18} /><span>{setValue.done ? (mm ? "ဒီ Set ပြီးပါပြီ" : "Set completed") : (mm ? "ဒီ Set ပြီးပြီ" : "Mark set done")}</span></button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sticky bottom-20 z-20 mt-4 overflow-hidden rounded-2xl bg-charcoal text-white shadow-[0_-12px_40px_rgba(6,17,26,.14)] lg:bottom-4">
        <div className="grid sm:grid-cols-[1fr_auto] sm:items-stretch">
          <div className="flex items-center gap-3 p-3 sm:px-5">
            <button type="button" onClick={() => { if (rest <= 0) setRest(active.rest_seconds); setRunning((value) => rest <= 0 ? true : !value); }} className="grid h-12 w-12 flex-none place-items-center rounded-lg bg-sky text-charcoal" aria-label={running ? (mm ? "နားချိန်ခဏရပ်မယ်" : "Pause rest timer") : (mm ? "နားချိန်စမယ်" : "Start rest timer")}>{running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
            <div className="min-w-0"><p className="text-[9px] font-bold text-white/42">{mm ? "နားချိန်" : "REST TIMER"}</p><div className="flex items-baseline gap-2"><p aria-live="polite" className="mono text-2xl font-bold">{restLabel}</p><span className="truncate text-[10px] text-white/42" lang={mm ? "my" : "en"}>{rest > 0 ? (running ? (mm ? "နားနေပါ" : "Rest now") : (mm ? "ခဏရပ်ထားတယ်" : "Paused")) : (mm ? "Set ပြီးရင် အလိုအလျောက်စမယ်" : "Starts after each set")}</span></div></div>
            {rest > 0 ? <button type="button" onClick={() => { setRest(0); setRunning(false); }} className="ml-auto rounded-lg border border-white/15 px-3 py-2 text-[10px] font-semibold text-white/65 hover:text-white">{mm ? "ကျော်မယ်" : "Skip"}</button> : null}
          </div>

          {completedSets === totalSets ? (
            <button type="button" disabled={finishing} onClick={finishWorkout} className="flex min-h-16 items-center justify-between gap-5 border-t border-white/15 bg-sky px-5 text-sm font-bold text-charcoal sm:min-w-64 sm:border-l sm:border-t-0"><span>{finishing ? (mm ? "သိမ်းနေပါတယ်…" : "Finishing…") : (mm ? "ဒီနေ့ Workout ပြီးပြီ" : "Finish today's workout")}</span><CheckCircle2 size={19} /></button>
          ) : activeDone === active.sets ? (
            <button type="button" onClick={continueWorkout} className="flex min-h-16 items-center justify-between gap-5 border-t border-white/15 bg-white px-5 text-sm font-bold text-charcoal sm:min-w-64 sm:border-l sm:border-t-0"><span>{mm ? "နောက်လေ့ကျင့်ခန်း ဆက်မယ်" : "Continue to next exercise"}</span><ArrowRight size={18} /></button>
          ) : (
            <div className="flex min-w-56 items-center justify-center border-t border-white/12 px-5 py-3 text-center text-xs font-semibold text-white/55 sm:border-l sm:border-t-0" lang={mm ? "my" : "en"}>{mm ? `ဒီလေ့ကျင့်ခန်းမှာ ${activeRemaining} Sets ကျန်ပါတယ်` : `${activeRemaining} sets left in this exercise`}</div>
          )}
        </div>
      </section>
    </div>
  );
}

function ExerciseVideoCarousel({ locale, videos }: { locale: Locale; videos: WorkoutItem["exercise"]["videos"] }) {
  const mm = locale === "mm";
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  if (!videos.length) return null;

  const moveTo = (next: number) => {
    const safe = Math.max(0, Math.min(videos.length - 1, next));
    setIndex(safe);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: safe * track.clientWidth, behavior: "smooth" });
  };

  return <section className="border-b border-charcoal/10 bg-charcoal text-white">
    <div ref={trackRef} onScroll={(event) => {
      const track = event.currentTarget;
      if (track.clientWidth) setIndex(Math.round(track.scrollLeft / track.clientWidth));
    }} className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {videos.map((video) => <article key={video.id} className="min-w-full snap-center">
        <div className="relative aspect-video overflow-hidden bg-black"><video className="h-full w-full object-contain" controls playsInline preload="metadata" src={video.url} /></div>
        <div className="flex items-start gap-3 p-4 sm:p-5"><span className={`mt-0.5 grid h-8 w-8 flex-none place-items-center ${video.role === "alternative" ? "bg-white text-charcoal" : "bg-sky text-charcoal"}`}><Video size={15} /></span><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{mm ? video.title_mm : video.title_en}</strong><span className="rounded-full border border-white/15 px-2 py-0.5 text-[8px] font-bold tracking-wider text-white/55">{video.role === "alternative" ? (mm ? "အစားထိုးနည်း" : "Alternative") : (mm ? "ပုံမှန်နည်း" : "Main version")}</span></div>{(mm ? video.cue_mm : video.cue_en) ? <p className="mt-1 text-xs leading-5 text-white/55" lang={mm ? "my" : "en"}>{mm ? video.cue_mm : video.cue_en}</p> : null}</div></div>
      </article>)}
    </div>
    {videos.length > 1 ? <div className="flex items-center justify-between border-t border-white/10 px-4 py-3"><button type="button" onClick={() => moveTo(index - 1)} disabled={index === 0} className="flex items-center gap-2 text-[10px] font-bold text-white/62 disabled:opacity-20"><ChevronLeft size={15} />{mm ? "အရင်နည်း" : "Previous"}</button><div className="flex gap-1.5" aria-label={mm ? "Video ရွေးမယ်" : "Choose video"}>{videos.map((video, dot) => <button key={video.id} type="button" onClick={() => moveTo(dot)} aria-label={`${dot + 1}`} className={`h-1.5 rounded-full transition-all ${dot === index ? "w-7 bg-sky" : "w-1.5 bg-white/25"}`} />)}</div><button type="button" onClick={() => moveTo(index + 1)} disabled={index === videos.length - 1} className="flex items-center gap-2 text-[10px] font-bold text-white/62 disabled:opacity-20">{mm ? "နောက်နည်း" : "Next"}<ChevronRight size={15} /></button></div> : null}
  </section>;
}

function ValueControl({ label, suffix, value, step, onChange }: { label: string; suffix: string; value: number; step: number; onChange: (value: number) => void }) {
  return <div className="overflow-hidden rounded-lg border border-charcoal/12 bg-white"><p className="border-b border-charcoal/8 px-3 py-1.5 text-[9px] font-semibold text-charcoal/40">{label}</p><div className="grid grid-cols-[48px_1fr_48px]"><button type="button" onClick={() => onChange(Math.max(0, value - step))} className="grid min-h-12 place-items-center border-r border-charcoal/10 bg-[#f4f6f5] hover:bg-ice" aria-label={`Decrease ${label}`}><Minus size={16} /></button><div className="grid place-items-center"><span className="text-lg font-bold">{Number.isInteger(value) ? value : value.toFixed(1)} <small className="text-[9px] font-semibold text-charcoal/35">{suffix}</small></span></div><button type="button" onClick={() => onChange(value + step)} className="grid min-h-12 place-items-center border-l border-charcoal/10 bg-[#f4f6f5] hover:bg-ice" aria-label={`Increase ${label}`}><Plus size={16} /></button></div></div>;
}
