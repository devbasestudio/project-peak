"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarCheck2, Check, Dumbbell, MoonStar } from "lucide-react";
import { toast } from "sonner";
import { saveWeeklySchedule } from "@/app/customer-actions";
import type { Locale } from "@/lib/i18n";
import type { WeeklyScheduleDay } from "@/lib/weekly-schedule";

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function createInitialDates(days: WeeklyScheduleDay[], today: string) {
  const result: string[] = [];
  days.forEach((day, index) => {
    if (day.scheduledDate) {
      result.push(day.scheduledDate);
      return;
    }
    const previous = result[index - 1];
    if (!previous) {
      result.push(today);
      return;
    }
    const minimum = addDays(previous, index === 2 ? 2 : 1);
    result.push(minimum < today ? today : minimum);
  });
  return result;
}

function validateDates(dates: string[], today: string, days: WeeklyScheduleDay[], mm: boolean) {
  if (dates.some((date) => !date)) return mm ? "လေ့ကျင့်မယ့်ရက် ၄ ရက်လုံး ရွေးပေးပါ။" : "Choose all four training dates.";
  for (let index = 0; index < dates.length; index += 1) {
    if (!days[index]?.completed && dates[index] < today) return mm ? "မဆော့ရသေးတဲ့ session ကို ပြီးခဲ့တဲ့ရက် မရွေးနိုင်ပါဘူး။" : "Upcoming sessions cannot be scheduled in the past.";
    if (index > 0 && dates[index] <= dates[index - 1]) return mm ? "Session ရက်တွေကို အစဉ်လိုက် ရွေးပေးပါ။" : "Keep the session dates in order.";
  }
  if (dates[2] <= addDays(dates[1], 1)) return mm ? "ဒုတိယနဲ့ တတိယ session ကြားမှာ အနည်းဆုံး တစ်ရက်နားပေးပါ။" : "Keep at least one rest day between sessions two and three.";
  return null;
}

export function WeeklySchedulePlanner({ locale, programId, weekNumber, days, today }: {
  locale: Locale;
  programId: string;
  weekNumber: number;
  days: WeeklyScheduleDay[];
  today: string;
}) {
  const router = useRouter();
  const mm = locale === "mm";
  const [dates, setDates] = useState(() => createInitialDates(days, today));
  const [saving, setSaving] = useState(false);
  const error = useMemo(() => validateDates(dates, today, days, mm), [dates, days, mm, today]);
  const alreadySaved = days.every((day) => Boolean(day.scheduledDate));

  const changeDate = (index: number, value: string) => {
    setDates((current) => current.map((date, itemIndex) => itemIndex === index ? value : date));
  };

  async function save() {
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    const result = await saveWeeklySchedule({ programId, weekNumber, dates, locale });
    setSaving(false);
    if (!result.ok) {
      toast.error(mm ? "အချိန်ဇယားကို မသိမ်းနိုင်သေးပါ" : "Could not save the schedule", { description: result.message });
      return;
    }
    toast.success(mm ? `အပတ် ${weekNumber} အချိန်ဇယား သိမ်းပြီးပါပြီ` : `Week ${weekNumber} schedule saved`);
    router.push(`/${locale}/app`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-xs font-semibold text-sky">{mm ? `အပတ် ${weekNumber} · လေ့ကျင့်ချိန် စီစဉ်မယ်` : `Week ${weekNumber} · Plan your training`}</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-[-.04em] sm:text-5xl" lang={mm ? "my" : "en"}>
            {mm ? "အားတဲ့ရက်ရွေးပြီး ဒီအပတ်ကို စတင်ပါ" : "Choose your free days, then start the week"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/55" lang={mm ? "my" : "en"}>
            {mm ? "ဒီအပတ်အတွက် Push ၂ ရက်၊ Pull ၂ ရက် ရှိပါတယ်။ ဒုတိယ session ပြီးရင် အနည်းဆုံး တစ်ရက်နားပြီးမှ နောက် session ကို ရွေးပေးပါ။" : "This week has two Push and two Pull sessions. Keep at least one recovery day after the second session."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-xs font-semibold text-charcoal/58">
          <CalendarCheck2 size={17} className="text-sky" />
          {alreadySaved ? (mm ? "ပြန်ပြင်နိုင်ပါတယ်" : "You can adjust upcoming days") : (mm ? "Save ပြီးမှ Workout ဖွင့်မယ်" : "Save to unlock workouts")}
        </div>
      </header>

      <section className="mt-6 overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-[0_18px_55px_rgba(6,17,26,.07)]">
        <div className="grid border-b border-charcoal/8 bg-charcoal px-5 py-4 text-white sm:grid-cols-[1fr_auto] sm:items-center sm:px-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-sky">4 TRAINING DAYS</p>
            <p className="mt-1 text-sm text-white/55" lang={mm ? "my" : "en"}>{mm ? "ရက်တစ်ရက်ချင်းနှိပ်ပြီး ကိုယ်အားတဲ့ရက်ကို ပြောင်းရွေးပါ။" : "Tap each date and match it to your availability."}</p>
          </div>
          <span className="mt-3 w-fit rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold sm:mt-0">PUSH · PULL · REST · PUSH · PULL</span>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid gap-3 lg:grid-cols-4">
            {days.map((day, index) => {
              const date = dates[index] ?? "";
              const formatted = date ? new Intl.DateTimeFormat(mm ? "my-MM" : "en-US", { weekday: "long", month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00`)) : "";
              const derivedMin = index === 0 ? today : addDays(dates[index - 1] || today, index === 2 ? 2 : 1);
              const min = day.completed || derivedMin >= today ? derivedMin : today;
              return (
                <div key={day.id} className="contents">
                  {index === 2 ? (
                    <div className="flex items-center gap-3 rounded-xl bg-ice px-4 py-3 text-xs font-semibold text-aqua lg:col-span-4">
                      <MoonStar size={17} />
                      <span lang={mm ? "my" : "en"}>{mm ? "Recovery day · ခန္ဓာကိုယ်ကို အနည်းဆုံး တစ်ရက်နားပါ" : "Recovery day · Take at least one full day off"}</span>
                    </div>
                  ) : null}
                  <article className={`rounded-xl border p-4 transition ${day.completed ? "border-sky/30 bg-ice/55" : "border-charcoal/10 bg-[#f7f8f7] focus-within:border-sky focus-within:bg-white"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-charcoal text-xs font-bold text-white">{index + 1}</span>
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${day.dayType === "push" ? "bg-sky text-charcoal" : "bg-white text-charcoal ring-1 ring-charcoal/12"}`}>{day.dayType.toUpperCase()}</span>
                    </div>
                    <p className="mt-5 text-[10px] font-semibold text-charcoal/38">{mm ? `Session ${day.dayNumber}` : `Session ${day.dayNumber}`}</p>
                    <h2 className="mt-1 min-h-12 text-sm font-bold leading-6" lang={mm ? "my" : "en"}>{(mm ? day.titleMm : day.titleEn) || `${day.dayType.toUpperCase()} SESSION`}</h2>
                    <label className="mt-4 block">
                      <span className="mb-2 block text-[10px] font-semibold text-charcoal/42">{day.completed ? (mm ? "ပြီးခဲ့တဲ့ရက်" : "Completed on") : (mm ? "လေ့ကျင့်မယ့်ရက်" : "Training date")}</span>
                      <input
                        type="date"
                        value={date}
                        min={min}
                        disabled={day.completed}
                        onChange={(event) => changeDate(index, event.target.value)}
                        className="min-h-12 w-full rounded-lg border border-charcoal/12 bg-white px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-transparent disabled:text-charcoal/48"
                        aria-label={mm ? `Session ${day.dayNumber} ရက်ရွေးမယ်` : `Choose date for session ${day.dayNumber}`}
                      />
                    </label>
                    <p className="mt-2 min-h-5 text-xs text-charcoal/45" lang={mm ? "my" : "en"}>{formatted}</p>
                    {day.completed ? <p className="mt-3 flex items-center gap-2 text-[10px] font-bold text-aqua"><Check size={14} />{mm ? "ပြီးပါပြီ" : "COMPLETED"}</p> : null}
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="grid gap-3 border-t border-charcoal/8 bg-[#f4f6f5] p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
          <div className="flex items-start gap-3 text-xs leading-5 text-charcoal/52">
            <Dumbbell className="mt-0.5 shrink-0 text-sky" size={17} />
            <span lang={mm ? "my" : "en"}>{error ?? (mm ? "အချိန်ဇယားသိမ်းပြီးတာနဲ့ ဒီအပတ် Workout အားလုံး ဖွင့်ပေးပါမယ်။" : "Saving this plan unlocks every workout in the current week.")}</span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-2 sm:flex">
            <button type="button" onClick={() => router.push(`/${locale}/app`)} className="grid h-13 w-13 place-items-center rounded-xl border border-charcoal/12 bg-white" aria-label={mm ? "နောက်ပြန်" : "Go back"}><ArrowLeft size={18} /></button>
            <button type="button" onClick={save} disabled={saving || Boolean(error)} className="flex min-h-13 items-center justify-center gap-3 rounded-xl bg-charcoal px-6 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-35">
              {saving ? (mm ? "သိမ်းနေပါတယ်…" : "Saving…") : alreadySaved ? (mm ? "အချိန်ဇယား ပြင်ပြီးသိမ်းမယ်" : "Update schedule") : (mm ? "အချိန်ဇယား သိမ်းပြီးစမယ်" : "Save and unlock week")}
              <ArrowRight size={17} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
