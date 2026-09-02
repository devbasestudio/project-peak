"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Droplets,
  LockKeyhole,
  Moon,
  Play,
  Send,
  Utensils,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { createPurchaseOrder } from "@/app/actions";
import { ProgramBlocks, type ProgramBlock } from "@/components/app-shell/program-blocks";
import type { Locale } from "@/lib/i18n";
import type { WeeklyScheduleDay } from "@/lib/weekly-schedule";

type Order = { reference_code: string; status: string; amount_minor: number; currency: string } | null;
type Program = { id: string; status: string; name_mm: string; name_en: string; completed: number; hasBaseline: boolean } | null;

export function CustomerDashboard({ locale, order, program, email, habits, programBlocks, weekSchedule }: { locale: Locale; order: Order; program: Program; email: string; habits: { protein: boolean; water: boolean; sleep_hours: number | null } | null; programBlocks: ProgramBlock[]; weekSchedule: WeeklyScheduleDay[] }) {
  const [pending, setPending] = useState(false);
  const mm = locale === "mm";

  if (!program) {
    return (
      <div className="mx-auto max-w-4xl">
        <header className="mb-7">
          <p className="text-xs font-semibold text-sky">PROJECT PEAK · 12 WEEKS</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-[-.04em] sm:text-5xl" lang={mm ? "my" : "en"}>
            {order ? (mm ? "Payment အတည်ပြုချက် စောင့်နေပါတယ်" : "Your payment is being reviewed") : (mm ? "12 ပတ် Program ကို စတင်မယ်" : "Start your 12-week program")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/58" lang={mm ? "my" : "en"}>
            {order
              ? (mm ? "Admin အတည်ပြုပြီးတာနဲ့ Baseline Test ကနေ စနိုင်ပါပြီ။" : "Once approved, your program opens at the baseline test.")
              : (mm ? "Reference code ထုတ်ပြီး KBZPay နဲ့ ငွေပေးချေပါ။ ပြီးရင် code နဲ့ email ကို Admin ဆီပို့ရုံပါပဲ။" : "Create your reference, pay by KBZPay, then send the code and your email to the admin.")}
          </p>
        </header>

        {!order ? (
          <form
            action={async () => {
              setPending(true);
              try { await createPurchaseOrder(locale); } finally { setPending(false); }
            }}
            className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-[0_16px_50px_rgba(6,17,26,.06)]"
          >
            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-end sm:p-8">
              <div>
                <p className="text-xs font-semibold text-charcoal/45">12 weeks · 48 sessions · home workout</p>
                <p className="mt-4 font-display text-5xl font-bold tracking-[-.06em]">75,000 <span className="text-base tracking-normal text-charcoal/45">MMK</span></p>
                <p className="mt-3 text-sm leading-6 text-charcoal/55">{mm ? "တစ်ကြိမ်ပေးချေပြီး Program အပြည့်သုံးနိုင်ပါတယ်။" : "One payment gives you the complete program."}</p>
              </div>
              <button disabled={pending} className="flex min-h-13 items-center justify-center gap-3 rounded-xl bg-charcoal px-6 text-sm font-semibold text-white disabled:opacity-55">
                {pending ? (mm ? "လုပ်ဆောင်နေပါတယ်…" : "Creating…") : (mm ? "Reference code ထုတ်မယ်" : "Create payment reference")}
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        ) : (
          <PaymentCard locale={locale} order={order} email={email} />
        )}
      </div>
    );
  }

  const completed = program.completed;
  const nextDay = Math.min(completed + 1, 48);
  const week = Math.min(12, Math.floor(completed / 4) + 1);
  const dayType = nextDay === 48 ? (mm ? "နောက်ဆုံးစမ်းသပ်မှု" : "Final challenge") : nextDay % 2 === 1 ? "PUSH" : "PULL";
  const progress = Math.round((completed / 48) * 100);
  const scheduleReady = weekSchedule.length === 4 && weekSchedule.every((day) => Boolean(day.scheduledDate));
  const actionHref = !program.hasBaseline ? `/${locale}/app/baseline` : scheduleReady ? `/${locale}/app/workout` : `/${locale}/app/schedule`;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-sky">{mm ? `အပတ် ${week} · 12 ပတ် Program` : `Week ${week} · 12 week program`}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-.04em] sm:text-4xl" lang={mm ? "my" : "en"}>{mm ? "ဒီနေ့ လုပ်စရာ" : "Today’s plan"}</h1>
          <p className="mt-2 text-sm text-charcoal/50">{mm ? program.name_mm : program.name_en}</p>
        </div>
        <Link href={`/${locale}/app/progress`} className="flex min-h-10 items-center gap-2 rounded-lg border border-charcoal/10 bg-white px-3 text-xs font-semibold">
          {progress}% {mm ? "ပြီးပါပြီ" : "complete"}<ChevronRight size={14} />
        </Link>
      </header>

      <section className="overflow-hidden rounded-2xl bg-charcoal text-white shadow-[0_20px_60px_rgba(6,17,26,.13)]">
        <div className="grid lg:grid-cols-[1fr_230px]">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/70">{mm ? `Session ${nextDay} / 48` : `Session ${nextDay} of 48`}</span>
              <span className="text-xs font-medium text-white/45">{48 - completed} {mm ? "ခု ကျန်" : "remaining"}</span>
            </div>
            <h2 className="mt-8 font-display text-5xl font-bold tracking-[-.05em] sm:text-6xl">{!program.hasBaseline ? (mm ? "Baseline Test" : "Baseline test") : scheduleReady ? dayType : (mm ? `အပတ် ${week} စီစဉ်မယ်` : `Plan week ${week}`)}</h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-white/55" lang={mm ? "my" : "en"}>
              {!program.hasBaseline
                ? (mm ? "Workout မစခင် လက်ရှိအားကို တိုင်းပြီး Week 12 မှာ ပြန်နှိုင်းယှဉ်ပါမယ်။" : "Measure your starting point before your first workout.")
                : scheduleReady
                  ? (mm ? "ဒီနေ့ session ကို ဖွင့်ပြီး set တစ်ခုပြီးတိုင်း reps နဲ့ weight ကို မှတ်ပါ။" : "Open today’s session and log each set as you train.")
                  : (mm ? "ဒီအပတ်မှာ ဆော့ရမယ့် session ၄ ခုကို ကြည့်ပြီး ကိုယ်အားတဲ့ရက်တွေ ရွေးပါ။ အချိန်ဇယားသိမ်းပြီးမှ Workout ဖွင့်ပေးပါမယ်။" : "Review all four sessions, choose the days you are free, and save the week before training.")}
            </p>
            <Link href={actionHref} className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-sky px-5 text-sm font-bold text-charcoal sm:w-fit sm:min-w-64">
              {program.hasBaseline && !scheduleReady ? <CalendarDays size={18} /> : <Play size={17} fill="currentColor" />}
              {!program.hasBaseline ? (mm ? "Baseline Test စမယ်" : "Start baseline test") : scheduleReady ? (mm ? "ဒီနေ့ Workout စမယ်" : "Start today’s workout") : (mm ? "အားတဲ့ရက်တွေ ရွေးမယ်" : "Choose training days")}
              <ArrowRight size={17} />
            </Link>
          </div>
          <div className="border-t border-white/10 bg-white/[.045] p-6 lg:border-l lg:border-t-0">
            <p className="text-[11px] font-semibold text-white/45">{mm ? "Program တိုးတက်မှု" : "Program progress"}</p>
            <div className="mt-5 flex items-end gap-2"><strong className="font-display text-5xl tracking-[-.05em]">{progress}</strong><span className="mb-2 text-sm text-white/45">%</span></div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sky" style={{ width: `${progress}%` }} /></div>
            <div className="mt-4 flex justify-between text-[10px] text-white/38"><span>{completed} {mm ? "ပြီး" : "done"}</span><span>48</span></div>
          </div>
        </div>
      </section>

      {program.hasBaseline ? <WeeklyScheduleOverview locale={locale} week={week} days={weekSchedule} ready={scheduleReady} /> : null}

      <ProgramBlocks locale={locale} blocks={programBlocks} />

      <section className="mt-5 overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
        <div className="flex items-center justify-between gap-4 border-b border-charcoal/8 px-5 py-4">
          <div><h2 className="text-base font-bold" lang={mm ? "my" : "en"}>{mm ? "ဒီနေ့ နေထိုင်မှုပုံစံ" : "Today’s basics"}</h2><p className="mt-1 text-xs text-charcoal/45">{mm ? "သုံးခုလောက်ပဲ မှတ်ထားပါ" : "A quick three-item check"}</p></div>
          <Link href={`/${locale}/app/habits`} className="flex items-center gap-1.5 text-xs font-semibold text-sky">{mm ? "ပြင်မယ်" : "Edit"}<ChevronRight size={14} /></Link>
        </div>
        <div className="grid sm:grid-cols-3">
          <HabitStatus icon={Utensils} label="Protein" value={habits?.protein ? (mm ? "ပြီး" : "Done") : (mm ? "မမှတ်ရသေး" : "Not logged")} done={Boolean(habits?.protein)} />
          <HabitStatus icon={Droplets} label={mm ? "ရေ" : "Water"} value={habits?.water ? (mm ? "ပြီး" : "Done") : (mm ? "မမှတ်ရသေး" : "Not logged")} done={Boolean(habits?.water)} />
          <HabitStatus icon={Moon} label={mm ? "အိပ်ချိန်" : "Sleep"} value={habits?.sleep_hours ? `${habits.sleep_hours}h` : (mm ? "မမှတ်ရသေး" : "Not logged")} done={Boolean(habits?.sleep_hours)} />
        </div>
      </section>

      <div className="mt-4 flex items-start gap-3 rounded-xl bg-charcoal/[.04] px-4 py-3 text-xs leading-5 text-charcoal/48">
        <WifiOff className="mt-0.5 shrink-0" size={15} />
        {mm ? "Internet မရှိချိန်မှာလည်း workout မှတ်တမ်းကို ဒီ device မှာ သိမ်းထားပေးပါတယ်။" : "Workout logs are saved on this device when your connection drops."}
      </div>
    </div>
  );
}

function WeeklyScheduleOverview({ locale, week, days, ready }: { locale: Locale; week: number; days: WeeklyScheduleDay[]; ready: boolean }) {
  const mm = locale === "mm";
  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-charcoal/8 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${ready ? "bg-ice text-aqua" : "bg-charcoal text-white"}`}>{ready ? <CalendarCheck2 size={19} /> : <CalendarDays size={19} />}</span>
          <div>
            <h2 className="text-base font-bold" lang={mm ? "my" : "en"}>{mm ? `အပတ် ${week} အချိန်ဇယား` : `Week ${week} schedule`}</h2>
            <p className="mt-1 text-xs text-charcoal/45" lang={mm ? "my" : "en"}>{ready ? (mm ? "ရက် ၄ ရက်လုံး စီစဉ်ပြီးပါပြီ" : "All four training days are planned") : (mm ? "Save ပြီးမှ ဒီအပတ် Workout စနိုင်ပါမယ်" : "Save your dates to unlock this week")}</p>
          </div>
        </div>
        <Link href={`/${locale}/app/schedule`} className="flex min-h-10 items-center gap-2 rounded-lg border border-charcoal/10 bg-[#f4f6f5] px-4 text-xs font-semibold">
          {ready ? (mm ? "ရက်ပြင်မယ်" : "Adjust dates") : (mm ? "ရက်ရွေးမယ်" : "Choose dates")}<ChevronRight size={14} />
        </Link>
      </header>

      <div className="grid gap-px bg-charcoal/8 sm:grid-cols-2 lg:grid-cols-4">
        {days.map((day, index) => {
          const formatted = day.scheduledDate ? new Intl.DateTimeFormat(mm ? "my-MM" : "en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${day.scheduledDate}T12:00:00`)) : (mm ? "ရက်မရွေးရသေး" : "Date not chosen");
          return <article key={day.id} className="relative bg-white px-5 py-5">
            <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold text-charcoal/35">SESSION {day.dayNumber}</span><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${day.dayType === "push" ? "bg-sky text-charcoal" : "bg-[#f1f3f2] text-charcoal"}`}>{day.dayType.toUpperCase()}</span></div>
            <p suppressHydrationWarning className={`mt-4 text-sm font-bold ${day.scheduledDate ? "text-charcoal" : "text-charcoal/35"}`} lang={mm ? "my" : "en"}>{formatted}</p>
            <p className="mt-1 truncate text-xs text-charcoal/40" lang={mm ? "my" : "en"}>{(mm ? day.titleMm : day.titleEn) || `${day.dayType.toUpperCase()} session`}</p>
            {day.completed ? <span className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-aqua"><Check size={13} />{mm ? "ပြီးပါပြီ" : "COMPLETED"}</span> : null}
            {index === 1 ? <span className="absolute -bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-charcoal px-3 py-1 text-[8px] font-bold tracking-wider text-white sm:hidden">REST</span> : null}
          </article>;
        })}
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-charcoal/8 bg-ice/45 px-4 py-2.5 text-[10px] font-bold text-aqua"><Moon size={14} />{mm ? "Session 2 ပြီးရင် အနည်းဆုံး တစ်ရက်နားပါ" : "At least one recovery day after session 2"}</div>
    </section>
  );
}

function HabitStatus({ icon: Icon, label, value, done }: { icon: typeof Utensils; label: string; value: string; done: boolean }) {
  return (
    <div className="flex min-h-20 items-center gap-3 border-b border-charcoal/8 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${done ? "bg-ice text-aqua" : "bg-[#f1f3f2] text-charcoal/35"}`}><Icon size={18} /></span>
      <span><strong className="block text-sm font-semibold">{label}</strong><small className={`mt-1 block text-[11px] ${done ? "text-aqua" : "text-charcoal/40"}`}>{value}</small></span>
      {done ? <Check className="ml-auto text-aqua" size={17} /> : null}
    </div>
  );
}

function PaymentCard({ locale, order, email }: { locale: Locale; order: NonNullable<Order>; email: string }) {
  const mm = locale === "mm";
  const message = mm
    ? `Project Peak Home Workout အတွက် ငွေပေးချေပြီးပါပြီ။\nReference: ${order.reference_code}\nEmail: ${email}`
    : `I have paid for Project Peak Home Workout.\nReference: ${order.reference_code}\nEmail: ${email}`;
  const adminMessageHref = `https://t.me/wayneax21?text=${encodeURIComponent(message)}`;
  return (
    <section className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-[0_16px_50px_rgba(6,17,26,.06)]">
      <div className="grid lg:grid-cols-[300px_1fr]">
        <div className="bg-[#0d5aad] p-5">
          <div className="overflow-hidden rounded-xl bg-white p-2"><Image src="/payment/kbzpay-project-peak.jpg" alt="KBZPay QR code" width={828} height={1228} className="h-auto w-full" priority /></div>
          <p className="mt-3 text-center text-xs leading-5 text-white/70">{mm ? "KBZPay နဲ့ scan ဖတ်ပြီး 75,000 MMK ပေးချေပါ။" : "Scan with KBZPay and pay 75,000 MMK."}</p>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-charcoal/45">PAYMENT REFERENCE</p><h2 className="mt-2 text-xl font-bold">75,000 MMK</h2></div><span className="rounded-full bg-[#fff5d8] px-3 py-1.5 text-[10px] font-bold uppercase text-[#86600c]">{order.status.replaceAll("_", " ")}</span></div>
          <button type="button" onClick={() => { navigator.clipboard.writeText(order.reference_code); toast.success(mm ? "Reference code ကူးပြီးပါပြီ" : "Reference copied"); }} className="mt-6 flex w-full items-center justify-between gap-3 rounded-xl border border-charcoal/10 bg-[#f4f6f5] px-4 py-4 text-left"><span className="mono break-all text-lg font-bold sm:text-2xl">{order.reference_code}</span><Copy className="shrink-0" size={17} /></button>
          <ol className="mt-6 space-y-3 text-sm leading-6 text-charcoal/60">
            <li className="flex gap-3"><span className="font-bold text-sky">1.</span>{mm ? "QR scan ဖတ်ပြီး ငွေပေးချေပါ။" : "Scan the QR and complete the payment."}</li>
            <li className="flex gap-3"><span className="font-bold text-sky">2.</span>{mm ? "အောက်က button ကိုနှိပ်ပါ။ Reference code နဲ့ email ကို အလိုအလျောက်ထည့်ပေးထားပါတယ်။" : "Tap the button below. Your reference and email are already included."}</li>
            <li className="flex gap-3"><span className="font-bold text-sky">3.</span>{mm ? "Admin ဆီ message ပို့ပြီး အတည်ပြုချက်ကို စောင့်ပါ။ Screenshot တင်စရာမလိုပါ။" : "Send the message and wait for approval. No screenshot upload is needed."}</li>
          </ol>
          <div className="mt-5 rounded-xl bg-[#f4f6f5] px-4 py-3 text-xs"><span className="text-charcoal/40">Email · </span><span className="break-all font-semibold">{email}</span></div>
          <a href={adminMessageHref} target="_blank" rel="noreferrer" className="mt-5 flex min-h-13 items-center justify-center gap-3 rounded-xl bg-charcoal px-5 text-sm font-semibold text-white"><Send size={17} />{mm ? "Admin ကို အသိပေးမယ်" : "Notify the admin"}<ArrowRight size={16} /></a>
        </div>
      </div>
      <div className="flex items-start gap-3 border-t border-charcoal/8 bg-[#f4f6f5] px-5 py-4 text-xs leading-5 text-charcoal/55"><LockKeyhole className="mt-0.5 shrink-0" size={16} />{mm ? "Admin အတည်ပြုပြီးတာနဲ့ ကိုယ်ပိုင် Program ဖွင့်ပေးပါမယ်။" : "Your personal program opens as soon as the payment is approved."}</div>
    </section>
  );
}
