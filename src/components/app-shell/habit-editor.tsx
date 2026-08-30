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
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 flex items-center justify-between border-b border-charcoal/15 pb-3">
        <Link href={`/${locale}/app`} className="grid min-h-11 min-w-11 place-items-center border border-charcoal/15 bg-white transition hover:bg-paper" aria-label={mm ? "ပြန်မယ်" : "Back"}><ArrowLeft size={17} /></Link>
        <div className={`flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.16em] ${syncState === "offline" ? "text-charcoal/38" : "text-charcoal"}`}>
          {syncState === "offline" ? <CloudOff size={15} /> : <Cloud size={15} />}
          {syncState === "offline" ? (mm ? "DEVICE မှာသိမ်းမယ်" : "SAVES ON DEVICE") : syncState === "synced" ? (mm ? "SYNC ပြီးပြီ" : "SYNCED") : (mm ? "ONLINE" : "ONLINE")}
        </div>
      </div>

      <header className="relative mb-10 overflow-hidden border-b-2 border-charcoal pb-8">
        <span className="absolute right-0 top-0 font-mono text-7xl font-black leading-none text-sky sm:text-9xl">{new Date(`${localDate}T00:00:00Z`).getUTCDate().toString().padStart(2, "0")}</span>
        <p className="relative font-mono text-[10px] font-bold uppercase tracking-[.2em] text-charcoal/45">DAILY FIELD NOTE · {prettyDate}</p>
        <h1 className="relative mt-5 max-w-2xl font-display text-5xl font-black uppercase leading-[.88] tracking-[-.065em] sm:text-7xl">{mm ? "ဒီနေ့ အလေ့အကျင့်" : "Daily discipline"}</h1>
        <p className="relative mt-5 max-w-xl text-sm leading-7 text-charcoal/55" lang={mm ? "my" : "en"}>{mm ? "အများကြီးတွက်စရာမလိုဘူး။ လုပ်ပြီးတာကို ရိုးရိုးလေးမှတ်ထားမယ်" : "No complicated tracking. Mark what you did and keep moving."}</p>
      </header>

      <section className="border-y border-charcoal bg-white">
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
        <div className="grid gap-5 border-t border-charcoal/15 px-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
          <div className="flex items-center gap-4">
            <span className="font-mono text-3xl font-black text-charcoal/15">03</span><Moon size={19} />
            <div><h2 className="font-display text-xl font-black uppercase">Sleep</h2><p className="mt-1 text-xs text-charcoal/42">{mm ? "အိပ်ခဲ့တဲ့ နာရီ" : "Hours slept"}</p></div>
          </div>
          <div className="flex min-h-14 items-center justify-between gap-5 border border-charcoal/15 bg-paper p-1 sm:min-w-64">
            <button type="button" onClick={() => setHabit((current) => ({ ...current, sleepHours: Math.max(0, (current.sleepHours ?? 0) - 0.5) }))} className="grid h-11 w-11 place-items-center border-r border-charcoal/10 bg-white" aria-label="Decrease sleep"><Minus size={17} /></button>
            <span className="mono text-xl font-bold">{habit.sleepHours == null ? "—" : `${habit.sleepHours.toFixed(1)}h`}</span>
            <button type="button" onClick={() => setHabit((current) => ({ ...current, sleepHours: Math.min(24, (current.sleepHours ?? 0) + 0.5) }))} className="grid h-11 w-11 place-items-center bg-sky" aria-label="Increase sleep"><Plus size={17} /></button>
          </div>
        </div>
      </section>

      <button type="button" disabled={saving} onClick={save} className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 bg-charcoal px-5 text-sm font-bold text-white transition hover:bg-charcoal/90 disabled:opacity-45"><Save size={17} />{saving ? (mm ? "သိမ်းနေတယ်…" : "Saving…") : (mm ? "ဒီနေ့ habit သိမ်းမယ်" : "Save today’s habits")}</button>
      <Link href={`/${locale}/app/progress`} className="mt-3 flex min-h-12 w-full items-center justify-center border border-charcoal/15 bg-white text-sm font-bold transition hover:bg-paper">{mm ? "Habit history ကြည့်မယ်" : "View habit history"}</Link>
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
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="group flex min-h-24 w-full items-center justify-between gap-4 border-t border-charcoal/15 px-4 py-6 text-left first:border-t-0 sm:px-6">
      <span className="flex items-center gap-4">
        <span className="font-mono text-3xl font-black text-charcoal/15">{label === "Protein" ? "01" : "02"}</span>
        <span className={`grid h-10 w-10 shrink-0 place-items-center border border-charcoal/15 transition ${checked ? "bg-sky text-charcoal" : "bg-paper text-charcoal/42"}`}><Icon size={18} /></span>
        <span><span className="block font-display text-xl font-black uppercase">{label}</span><span className="mt-1 block text-xs text-charcoal/42">{detail}</span></span>
      </span>
      <span className={`grid h-10 w-10 shrink-0 place-items-center border transition ${checked ? "border-charcoal bg-charcoal text-white" : "border-charcoal/20 bg-white"}`}>{checked ? <Check size={16} /> : null}</span>
    </button>
  );
}
