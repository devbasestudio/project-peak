"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
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

type Order = { reference_code: string; status: string; amount_minor: number; currency: string } | null;
type Program = { id: string; status: string; name_mm: string; name_en: string; completed: number; hasBaseline: boolean } | null;

export function CustomerDashboard({ locale, order, program, email, habits, programBlocks }: { locale: Locale; order: Order; program: Program; email: string; habits: { protein: boolean; water: boolean; sleep_hours: number | null } | null; programBlocks: ProgramBlock[] }) {
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
              : (mm ? "ငွေပေးချေရန် reference code ထုတ်ပြီး KBZPay screenshot နဲ့အတူ ပို့ပေးပါ။" : "Create your reference code, pay by KBZPay, and send the screenshot for approval.")}
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
  const actionHref = program.hasBaseline ? `/${locale}/app/workout` : `/${locale}/app/baseline`;

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
            <h2 className="mt-8 font-display text-5xl font-bold tracking-[-.05em] sm:text-6xl">{program.hasBaseline ? dayType : (mm ? "Baseline Test" : "Baseline test")}</h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-white/55" lang={mm ? "my" : "en"}>
              {program.hasBaseline
                ? (mm ? "ဒီနေ့ session ကို ဖွင့်ပြီး set တစ်ခုပြီးတိုင်း reps နဲ့ weight ကို မှတ်ပါ။" : "Open today’s session and log each set as you train.")
                : (mm ? "Workout မစခင် လက်ရှိအားကို တိုင်းပြီး Week 12 မှာ ပြန်နှိုင်းယှဉ်ပါမယ်။" : "Measure your starting point before your first workout.")}
            </p>
            <Link href={actionHref} className="mt-7 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-sky px-5 text-sm font-bold text-charcoal sm:w-fit sm:min-w-64">
              <Play size={17} fill="currentColor" />
              {program.hasBaseline ? (mm ? "ဒီနေ့ Workout စမယ်" : "Start today’s workout") : (mm ? "Baseline Test စမယ်" : "Start baseline test")}
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
            <li className="flex gap-3"><span className="font-bold text-sky">2.</span>{mm ? "ငွေလွှဲအောင်မြင်တဲ့ screenshot ကို သိမ်းပါ။" : "Save the successful payment screenshot."}</li>
            <li className="flex gap-3"><span className="font-bold text-sky">3.</span>{mm ? "Screenshot၊ reference code နဲ့ email ကို Telegram ပို့ပါ။" : "Send the screenshot, reference and email on Telegram."}</li>
          </ol>
          <div className="mt-5 rounded-xl bg-[#f4f6f5] px-4 py-3 text-xs"><span className="text-charcoal/40">Email · </span><span className="break-all font-semibold">{email}</span></div>
          <a href="https://t.me/wayneax21" target="_blank" rel="noreferrer" className="mt-5 flex min-h-13 items-center justify-center gap-3 rounded-xl bg-charcoal px-5 text-sm font-semibold text-white"><Send size={17} />{mm ? "Payment screenshot ပို့မယ်" : "Send payment screenshot"}<ArrowRight size={16} /></a>
        </div>
      </div>
      <div className="flex items-start gap-3 border-t border-charcoal/8 bg-[#f4f6f5] px-5 py-4 text-xs leading-5 text-charcoal/55"><LockKeyhole className="mt-0.5 shrink-0" size={16} />{mm ? "Admin အတည်ပြုပြီးတာနဲ့ ကိုယ်ပိုင် Program ဖွင့်ပေးပါမယ်။" : "Your personal program opens as soon as the payment is approved."}</div>
    </section>
  );
}
