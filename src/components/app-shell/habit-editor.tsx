"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Cloud, CloudOff, Droplets, Minus, Moon, Plus, Save, Utensils } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { enqueueMutation, flushQueue } from "@/lib/offline/mutation-queue";
import type { Locale } from "@/lib/i18n";

type HabitValue = { protein: boolean; water: boolean; sleepHours: number | null };

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function HabitEditor({
  locale,
  programId,
  userId,
  localDate,
  initialHabit,
}: {
  locale: Locale;
  programId: string;
  userId: string;
  localDate: string;
  initialHabit: HabitValue;
}) {
  const mm = locale === "mm";
  const [habit, setHabit] = useState(initialHabit);
  const [saving, setSaving] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "offline" | "synced">("idle");
  const prettyDate = useMemo(() => dayFormatter.format(new Date(`${localDate}T00:00:00Z`)), [localDate]);

  useEffect(() => {
    const onOnline = async () => {
      const result = await flushQueue(createClient());
      setSyncState(result.remaining ? "offline" : "synced");
      if (result.synced) toast.success(mm ? "Habit logs sync ပြီးပြီ" : "Habit logs synced");
    };
    const onOffline = () => setSyncState("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [mm]);

  async function save() {
    setSaving(true);
    try {
      const mutationId = crypto.randomUUID();
      await enqueueMutation({
        id: mutationId,
        table: "habit_logs",
        payload: {
          program_id: programId,
          user_id: userId,
          local_date: localDate,
          protein: habit.protein,
          water: habit.water,
          sleep_hours: habit.sleepHours,
          mutation_id: mutationId,
        },
      });

      if (!navigator.onLine) {
        setSyncState("offline");
        toast.success(mm ? "ဒီ device မှာ သိမ်းထားတယ်" : "Saved on this device", {
          description: mm ? "Online ပြန်ရတဲ့အခါ အလိုအလျောက် sync လုပ်မယ်" : "It will sync automatically when you reconnect.",
        });
        return;
      }

      const result = await flushQueue(createClient());
      if (result.remaining) {
        setSyncState("offline");
        toast.error(mm ? "Online sync မပြီးသေးဘူး" : "Online sync is still pending");
      } else {
        setSyncState("synced");
        toast.success(mm ? "ဒီနေ့ habit သိမ်းပြီးပြီ" : "Today’s habits are saved");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href={`/${locale}/app`} className="secondary-button min-h-11 px-3" aria-label={mm ? "ပြန်မယ်" : "Back"}><ArrowLeft size={17} /></Link>
        <div className={`flex items-center gap-2 text-xs font-bold ${syncState === "offline" ? "text-charcoal/38" : "text-aqua"}`}>
          {syncState === "offline" ? <CloudOff size={15} /> : <Cloud size={15} />}
          {syncState === "offline" ? (mm ? "DEVICE မှာသိမ်းမယ်" : "SAVES ON DEVICE") : syncState === "synced" ? (mm ? "SYNC ပြီးပြီ" : "SYNCED") : (mm ? "ONLINE" : "ONLINE")}
        </div>
      </div>

      <header className="mb-8">
        <p className="eyebrow text-aqua">DAILY HABITS · {prettyDate}</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.055em] sm:text-6xl">{mm ? "ဒီနေ့ အလေ့အကျင့်" : "Today’s habits"}</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-charcoal/52" lang={mm ? "my" : "en"}>{mm ? "အများကြီးတွက်စရာမလိုဘူး။ လုပ်ပြီးတာကို ရိုးရိုးလေးမှတ်ထားမယ်" : "No complicated tracking. Mark what you did and keep moving."}</p>
      </header>

      <section className="surface overflow-hidden">
        <HabitToggle
          label="Protein"
          detail={mm ? "ဒီနေ့ protein ကို ဦးစားပေးစားခဲ့တယ်" : "I prioritised protein today"}
          checked={habit.protein}
          icon={Utensils}
          onChange={(protein) => setHabit((current) => ({ ...current, protein }))}
        />
        <HabitToggle
          label="Water"
          detail={mm ? "ဒီနေ့ ရေသောက်တာ လုံလောက်တယ်" : "I drank enough water today"}
          checked={habit.water}
          icon={Droplets}
          onChange={(water) => setHabit((current) => ({ ...current, water }))}
        />
        <div className="grid gap-5 border-t border-charcoal/8 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-charcoal text-white"><Moon size={19} /></span>
            <div><h2 className="font-display text-xl font-bold">Sleep</h2><p className="mt-1 text-xs text-charcoal/42">{mm ? "အိပ်ခဲ့တဲ့ နာရီ" : "Hours slept"}</p></div>
          </div>
          <div className="flex min-h-14 items-center justify-between gap-5 rounded-xl border border-charcoal/10 bg-paper p-1.5 sm:min-w-64">
            <button type="button" onClick={() => setHabit((current) => ({ ...current, sleepHours: Math.max(0, (current.sleepHours ?? 0) - 0.5) }))} className="grid h-11 w-11 place-items-center rounded-lg bg-white" aria-label="Decrease sleep"><Minus size={17} /></button>
            <span className="mono text-xl font-bold">{habit.sleepHours == null ? "—" : `${habit.sleepHours.toFixed(1)}h`}</span>
            <button type="button" onClick={() => setHabit((current) => ({ ...current, sleepHours: Math.min(24, (current.sleepHours ?? 0) + 0.5) }))} className="grid h-11 w-11 place-items-center rounded-lg bg-sky" aria-label="Increase sleep"><Plus size={17} /></button>
          </div>
        </div>
      </section>

      <button type="button" disabled={saving} onClick={save} className="primary-button mt-5 w-full min-h-14"><Save size={17} />{saving ? (mm ? "သိမ်းနေတယ်…" : "Saving…") : (mm ? "ဒီနေ့ habit သိမ်းမယ်" : "Save today’s habits")}</button>
      <Link href={`/${locale}/app/progress`} className="secondary-button mt-3 w-full">{mm ? "Habit history ကြည့်မယ်" : "View habit history"}</Link>
    </div>
  );
}

function HabitToggle({
  label,
  detail,
  checked,
  icon: Icon,
  onChange,
}: {
  label: string;
  detail: string;
  checked: boolean;
  icon: typeof Utensils;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 border-t border-charcoal/8 p-5 text-left first:border-t-0 sm:p-7">
      <span className="flex items-center gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition ${checked ? "bg-sky text-charcoal" : "bg-charcoal/[.045] text-charcoal/42"}`}><Icon size={19} /></span>
        <span><span className="block font-display text-xl font-bold">{label}</span><span className="mt-1 block text-xs text-charcoal/42">{detail}</span></span>
      </span>
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${checked ? "border-sky bg-sky" : "border-charcoal/15 bg-white"}`}>{checked ? <Check size={15} /> : null}</span>
    </button>
  );
}
