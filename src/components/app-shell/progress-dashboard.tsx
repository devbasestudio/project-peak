"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Dumbbell, Droplets, Moon, Trophy, Utensils } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export type AssessmentComparison = {
  position: number;
  nameMm: string;
  nameEn: string;
  equipmentMm: string | null;
  equipmentEn: string | null;
  baseline: number;
  final: number | null;
};

export type ExerciseHistory = {
  id: string;
  nameMm: string;
  nameEn: string;
  sessions: Array<{ dayNumber: number; dayType: string; weightKg: number; reps: number[] }>;
};

type Tab = "days" | "history" | "proof";

export function ProgressDashboard({
  locale,
  program,
  sessions,
  habits,
  comparisons,
  histories,
}: {
  locale: Locale;
  program: { name: string; status: string; completed: number; startDate: string };
  sessions: Array<{ dayNumber: number; dayType: string; localDate: string }>;
  habits: Array<{ localDate: string; protein: boolean; water: boolean; sleepHours: number | null }>;
  comparisons: AssessmentComparison[];
  histories: ExerciseHistory[];
}) {
  const mm = locale === "mm";
  const [tab, setTab] = useState<Tab>("days");
  const [dayType, setDayType] = useState<"push" | "pull">("push");
  const progress = Math.min(100, Math.round((program.completed / 48) * 100));
  const week = Math.min(12, Math.floor(program.completed / 4) + 1);
  const cells = useMemo(() => buildDayCells(program.startDate, sessions, habits), [habits, program.startDate, sessions]);
  const visibleHistory = histories.filter((exercise) => exercise.sessions.some((session) => session.dayType === dayType));
  const habitDays = habits.length;
  const proteinDays = habits.filter((habit) => habit.protein).length;
  const waterDays = habits.filter((habit) => habit.water).length;
  const sleepAverage = habits.filter((habit) => habit.sleepHours != null).reduce((sum, habit, _, rows) => sum + (habit.sleepHours ?? 0) / rows.length, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <section className="relative overflow-hidden rounded-[2rem] bg-charcoal p-6 text-white sm:p-9">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/8" />
        <div className="relative grid gap-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="eyebrow text-sky">{program.name} · WEEK {week}</p><h1 className="mt-5 font-display text-5xl font-bold tracking-[-.06em] sm:text-7xl">{mm ? "ကိုယ့်တိုးတက်မှု" : "Your progress"}</h1><p className="mt-4 max-w-xl text-sm leading-7 text-white/48" lang={mm ? "my" : "en"}>{mm ? "Workout, habits နဲ့ ပထမနေ့က baseline ကို တစ်နေရာထဲမှာ ပြန်ကြည့်မယ်" : "See your training, daily habits and the proof that started on day one."}</p></div>
          <div className="flex items-end gap-3"><span className="mono text-7xl font-bold tracking-[-.09em] text-sky">{progress}</span><span className="mb-3 text-sm text-white/38">%</span></div>
        </div>
        <div className="relative mt-8 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-sky" style={{ width: `${progress}%` }} /></div>
        <div className="relative mt-5 flex flex-wrap gap-x-7 gap-y-2 text-xs text-white/42"><span><b className="mono mr-2 text-white">{program.completed}</b>/ 48 sessions</span><span><b className="mono mr-2 text-white">{Math.max(0, 48 - program.completed)}</b>{mm ? "ကျန်" : "remaining"}</span><span className="uppercase">{program.status}</span></div>
      </section>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-charcoal/10 bg-white p-1.5">
        {([
          ["days", mm ? "နေ့စဉ်" : "Daily"],
          ["history", mm ? "လေ့ကျင့်ခန်း" : "Exercises"],
          ["proof", mm ? "နှိုင်းယှဉ်" : "Proof"],
        ] as Array<[Tab, string]>).map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`min-h-11 rounded-lg px-3 text-xs font-bold transition ${tab === value ? "bg-charcoal text-white" : "text-charcoal/45"}`}>{label}</button>)}
      </div>

      {tab === "days" ? (
        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_.38fr]">
          <div className="surface p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4"><div><p className="eyebrow text-aqua">DAILY GRID</p><h2 className="mt-2 font-display text-2xl font-bold">{mm ? "တစ်နေ့ချင်းစီ" : "One day at a time"}</h2></div><Link href={`/${locale}/app/habits`} className="secondary-button min-h-10 px-3 text-xs">{mm ? "ဒီနေ့မှတ်မယ်" : "Log today"}<ArrowRight size={14} /></Link></div>
            {cells.length ? <div className="mt-6 grid grid-cols-4 gap-2.5">{cells.map((cell, index) => <DayCell key={cell.date} cell={cell} number={index + 1} />)}</div> : <Empty copy={mm ? "Activity မရှိသေးဘူး" : "No activity yet"} />}
            <div className="mt-5 flex flex-wrap gap-4 text-[10px] font-semibold text-charcoal/42"><Legend fill label={mm ? "ပြီး" : "Done"} /><Legend label={mm ? "မပြီးသေး" : "Not done"} /><Legend dashed label={mm ? "မသက်ဆိုင်" : "Not applicable"} /></div>
          </div>
          <aside className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Metric icon={Utensils} label="Protein" value={habitDays ? `${proteinDays}/${habitDays}` : "—"} />
            <Metric icon={Droplets} label="Water" value={habitDays ? `${waterDays}/${habitDays}` : "—"} />
            <Metric icon={Moon} label="Sleep avg" value={sleepAverage ? `${sleepAverage.toFixed(1)}h` : "—"} />
          </aside>
        </section>
      ) : null}

      {tab === "history" ? (
        <section className="surface mt-4 p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow text-aqua">EXERCISE HISTORY</p><h2 className="mt-2 font-display text-2xl font-bold">{mm ? "Session တစ်ခုပြီးတစ်ခု" : "Session by session"}</h2></div><div className="grid grid-cols-2 rounded-xl border border-charcoal/10 bg-paper p-1">{(["push", "pull"] as const).map((value) => <button key={value} type="button" onClick={() => setDayType(value)} className={`min-h-10 rounded-lg px-5 text-xs font-bold uppercase ${dayType === value ? "bg-sky text-charcoal" : "text-charcoal/38"}`}>{value}</button>)}</div></div>
          {visibleHistory.length ? <div className="mt-6 space-y-3">{visibleHistory.map((exercise) => <HistoryCard key={exercise.id} locale={locale} exercise={exercise} dayType={dayType} />)}</div> : <Empty copy={mm ? "ဒီ day type အတွက် logs မရှိသေးဘူး" : "No logs for this day type yet"} />}
        </section>
      ) : null}

      {tab === "proof" ? (
        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_.36fr]">
          <div className="surface p-5 sm:p-7"><p className="eyebrow text-aqua">WEEK 1 → WEEK 12</p><h2 className="mt-2 font-display text-2xl font-bold">{mm ? "စခဲ့တဲ့နေရာနဲ့ ရောက်နေတဲ့နေရာ" : "Where you started. Where you arrived."}</h2><div className="mt-6 space-y-2">{comparisons.map((item) => <ComparisonRow key={item.position} locale={locale} item={item} />)}</div></div>
          <aside className="rounded-[1.4rem] bg-charcoal p-6 text-white sm:p-8"><Trophy className="text-sky" /><p className="eyebrow mt-16 text-white/30">THE PROOF</p><h3 className="mt-3 font-display text-3xl font-bold tracking-[-.045em]">{comparisons.every((item) => item.final != null) ? (mm ? "12 weeks comparison အဆင်သင့်ဖြစ်ပြီ" : "Your 12-week comparison is ready") : (mm ? "Session 48 မှာ ပြန်စမ်းမယ်" : "Retest after session 48")}</h3>{program.completed >= 48 && comparisons.some((item) => item.final == null) ? <Link href={`/${locale}/app/completion`} className="mt-7 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky px-4 text-sm font-bold text-charcoal">{mm ? "Final flow စမယ်" : "Start final flow"}<ArrowRight size={16} /></Link> : null}</aside>
        </section>
      ) : null}
    </div>
  );
}

type DayCellValue = { date: string; protein: boolean; water: boolean; sleepHours: number | null; session: boolean };

function buildDayCells(startDate: string, sessions: Array<{ localDate: string }>, habits: Array<{ localDate: string; protein: boolean; water: boolean; sleepHours: number | null }>) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
  const safeStart = /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : today;
  const start = new Date(`${safeStart}T00:00:00Z`);
  const end = new Date(`${today}T00:00:00Z`);
  const habitMap = new Map(habits.map((habit) => [habit.localDate, habit]));
  const sessionDates = new Set(sessions.map((session) => session.localDate));
  const result: DayCellValue[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    const habit = habitMap.get(date);
    result.push({ date, protein: habit?.protein ?? false, water: habit?.water ?? false, sleepHours: habit?.sleepHours ?? null, session: sessionDates.has(date) });
  }
  return result.slice(-84);
}

function DayCell({ cell, number }: { cell: DayCellValue; number: number }) {
  return <div className="rounded-xl border border-charcoal/9 bg-white p-2.5"><div className="mb-2 flex items-center justify-between"><span className="mono text-[10px] font-bold text-charcoal/35">{number}</span>{cell.sleepHours != null ? <span className="mono text-[9px] text-charcoal/30">{cell.sleepHours}h</span> : null}</div><div className="grid grid-cols-3 gap-1"><Chip done={cell.protein} label="P" /><Chip done={cell.water} label="W" /><Chip done={cell.session} dashed={!cell.session} label="S" /></div></div>;
}

function Chip({ done, dashed = false, label }: { done: boolean; dashed?: boolean; label: string }) {
  return <span className={`grid aspect-square place-items-center rounded-[5px] border text-[8px] font-bold ${done ? "border-sky bg-sky text-charcoal" : dashed ? "border-dashed border-charcoal/15 text-charcoal/20" : "border-charcoal/10 text-charcoal/22"}`}>{done ? <Check size={9} /> : label}</span>;
}

function Legend({ label, fill = false, dashed = false }: { label: string; fill?: boolean; dashed?: boolean }) {
  return <span className="flex items-center gap-1.5"><i className={`h-3 w-3 rounded-[3px] border ${fill ? "border-sky bg-sky" : dashed ? "border-dashed border-charcoal/20" : "border-charcoal/15"}`} />{label}</span>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Dumbbell; label: string; value: string }) {
  return <div className="surface flex items-center justify-between p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-ice text-aqua"><Icon size={18} /></span><span className="text-xs font-bold text-charcoal/48">{label}</span></div><span className="mono text-xl font-bold">{value}</span></div>;
}

function HistoryCard({ locale, exercise, dayType }: { locale: Locale; exercise: ExerciseHistory; dayType: "push" | "pull" }) {
  const rows = exercise.sessions.filter((session) => session.dayType === dayType);
  return <article className="overflow-hidden rounded-xl border border-charcoal/9 bg-white"><header className="flex items-center justify-between gap-3 border-b border-charcoal/8 px-4 py-3"><h3 className="font-display font-bold">{locale === "mm" ? exercise.nameMm : exercise.nameEn}</h3><span className="mono text-[10px] text-charcoal/32">{rows.length} SESSIONS</span></header><div className="overflow-x-auto"><div className="grid min-w-max auto-cols-[92px] grid-flow-col gap-px bg-charcoal/8">{rows.map((row) => <div key={row.dayNumber} className="bg-white p-3 text-center"><p className="mono text-[9px] font-bold text-aqua">S{row.dayNumber}</p><p className="mono mt-2 text-sm font-bold">{row.weightKg} kg</p><p className="mono mt-1 text-[10px] text-charcoal/42">{row.reps.join("·")}</p></div>)}</div></div></article>;
}

function ComparisonRow({ locale, item }: { locale: Locale; item: AssessmentComparison }) {
  const difference = item.final == null ? null : item.final - item.baseline;
  return <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl border border-charcoal/8 bg-white px-4 py-4"><div><p className="font-display font-bold">{locale === "mm" ? item.nameMm : item.nameEn}</p><p className="mt-1 text-[10px] text-charcoal/35">{locale === "mm" ? item.equipmentMm : item.equipmentEn}</p></div><div className="text-right"><p className="eyebrow text-charcoal/28">W1</p><p className="mono mt-1 text-lg font-bold">{item.baseline}</p></div><div className="min-w-16 rounded-lg bg-ice px-3 py-2 text-right"><p className="eyebrow text-aqua">W12</p><p className="mono mt-1 text-lg font-bold text-aqua">{item.final ?? "—"}</p>{difference != null ? <p className="mono text-[9px] text-aqua">{difference >= 0 ? "+" : ""}{difference}</p> : null}</div></div>;
}

function Empty({ copy }: { copy: string }) {
  return <div className="mt-6 rounded-xl border border-dashed border-charcoal/15 px-5 py-10 text-center text-sm text-charcoal/38">{copy}</div>;
}
