"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Droplets, LockKeyhole, Moon, Play, Send, Utensils, WifiOff } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/lib/i18n";
import { createPurchaseOrder } from "@/app/actions";
import { ProgramBlocks, type ProgramBlock } from "@/components/app-shell/program-blocks";

type Order = { reference_code: string; status: string; amount_minor: number; currency: string } | null;
type Program = { id: string; status: string; name_mm: string; name_en: string; completed: number; hasBaseline: boolean } | null;

export function CustomerDashboard({ locale, order, program, email, habits, programBlocks }: { locale: Locale; order: Order; program: Program; email: string; habits: { protein: boolean; water: boolean; sleep_hours: number | null } | null; programBlocks: ProgramBlock[] }) {
  const [pending, setPending] = useState(false);
  const mm = locale === "mm";

  if (!program) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="eyebrow text-aqua">MEMBER ACCESS</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-[-.05em] sm:text-6xl">{order ? (mm ? "Payment confirm စောင့်နေတယ်" : "Waiting for payment confirmation") : (mm ? "12 weeks journey ကိုဖွင့်မယ်" : "Unlock your 12-week journey")}</h1>
          <p className="mt-5 max-w-2xl leading-7 text-charcoal/55" lang={mm ? "my" : "en"}>{mm ? "KPay payment ကို manual verify လုပ်ပြီးတာနဲ့ ကိုယ့်အတွက်သီးသန့် program copy တစ်ခုကိုဖွင့်ပေးမယ်" : "After your KPay payment is verified, we create an independent copy of the full program just for you."}</p>
        </div>

        {!order ? (
          <form action={async () => { setPending(true); try { await createPurchaseOrder(locale); } finally { setPending(false); } }} className="surface grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="eyebrow text-charcoal/38">HOME WORKOUT · 12 WEEKS</p>
              <p className="mono mt-5 text-5xl font-bold tracking-[-.07em] sm:text-7xl">75,000 <span className="text-base tracking-normal text-charcoal/40">MMK</span></p>
              <p className="mt-5 max-w-lg text-sm leading-7 text-charcoal/52">{mm ? "နှိပ်လိုက်ရင် ကိုယ့် Google account နဲ့ချိတ်ထားတဲ့ purchase reference code ထုတ်ပေးမယ်" : "Create a purchase reference tied to this account, then send it with your payment screenshot."}</p>
            </div>
            <button disabled={pending} className="primary-button min-w-52">{pending ? (mm ? "လုပ်နေတယ်…" : "Creating…") : (mm ? "Reference ထုတ်မယ်" : "Create reference")}<ArrowRight size={16} /></button>
          </form>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_.68fr]">
            <div className="surface p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <p className="eyebrow text-aqua">PURCHASE REFERENCE</p>
                <span className="rounded-full border border-sky/25 bg-ice px-3 py-1 text-[10px] font-bold uppercase tracking-wider">{order.status.replaceAll("_", " ")}</span>
              </div>
              <button type="button" onClick={() => { navigator.clipboard.writeText(order.reference_code); toast.success(mm ? "Reference copy ကူးပြီးပြီ" : "Reference copied"); }} className="mt-6 flex w-full items-center justify-between rounded-2xl border border-charcoal/10 bg-paper px-5 py-5 text-left">
                <span className="mono text-2xl font-bold tracking-[-.04em] sm:text-4xl">{order.reference_code}</span><Copy size={19} className="text-aqua" />
              </button>
              <div className="mt-6 space-y-4 text-sm leading-6 text-charcoal/58">
                <p><span className="mono mr-3 text-charcoal/28">01</span>{mm ? "75,000 MMK ကို KPay နဲ့ငွေလွှဲပါ" : "Pay 75,000 MMK by KPay"}</p>
                <p><span className="mono mr-3 text-charcoal/28">02</span>{mm ? "Payment screenshot + reference code + Google email ကိုပို့ပါ" : "Send the screenshot, reference code and Google email"}</p>
                <p className="break-all"><span className="mono mr-3 text-charcoal/28">03</span>{email}</p>
              </div>
              <a href="https://t.me/wayneax21" target="_blank" rel="noreferrer" className="primary-button mt-7 w-full sm:w-auto"><Send size={16} />Telegram @wayneax21</a>
            </div>
            <aside className="rounded-[1.4rem] border border-charcoal/10 bg-charcoal p-6 text-white sm:p-8">
              <LockKeyhole className="text-sky" />
              <h2 className="mt-16 font-display text-3xl font-bold tracking-[-.04em]">{mm ? "Program ကိုလုံခြုံစွာဖွင့်ပေးမယ်" : "Your program opens securely"}</h2>
              <p className="mt-4 text-sm leading-7 text-white/50" lang={mm ? "my" : "en"}>{mm ? "Admin confirm ပြီးတာနဲ့ baseline test ကစဖွင့်မယ်။ Master template နောက်ပိုင်းပြောင်းလဲမှုက ကိုယ့် program ကိုမထိခိုက်ဘူး" : "Once approved, you start with the baseline. Future master-template edits never rewrite your program."}</p>
            </aside>
          </div>
        )}
      </div>
    );
  }

  const completed = program.completed;
  const nextDay = Math.min(completed + 1, 48);
  const phase = completed < 12 ? 1 : 2;
  const week = Math.min(12, Math.floor(completed / 4) + 1);
  const dayType = nextDay === 48 ? "FINAL CHALLENGE" : nextDay % 2 === 1 ? "PUSH" : "PULL";
  const progress = Math.round((completed / 48) * 100);

  return (
    <div className="mx-auto max-w-5xl">
      <ProgramBlocks locale={locale} blocks={programBlocks} />
      <section className="grid gap-4 lg:grid-cols-[1fr_.42fr]">
        <article className="relative overflow-hidden rounded-[2rem] bg-charcoal p-6 text-white sm:p-9">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/8" />
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full border border-white/8" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="eyebrow text-sky">PHASE {phase} · WEEK {week}</p>
              <h1 className="mt-5 font-display text-5xl font-bold tracking-[-.06em] sm:text-7xl">{dayType}</h1>
              <p className="mt-3 text-sm text-white/45">Session {nextDay} · {48 - completed} remaining</p>
            </div>
            <span className="mono text-sm text-white/35">{String(completed).padStart(2, "0")}/48</span>
          </div>
          <div className="relative mt-14 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-sky" style={{ width: `${progress}%` }} /></div>
          <div className="relative mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={program.hasBaseline ? `/${locale}/app/workout` : `/${locale}/app/baseline`} className="flex min-h-14 flex-1 items-center justify-center gap-3 rounded-xl bg-sky px-5 font-bold text-charcoal transition hover:bg-[#32c1e8]">
              <Play size={18} fill="currentColor" />{program.hasBaseline ? (mm ? "ဒီနေ့ session စမယ်" : "Start today’s session") : (mm ? "Baseline အရင်စမယ်" : "Start baseline first")}
            </Link>
          </div>
        </article>

        <aside className="surface flex flex-col justify-between p-6 sm:p-7">
          <div>
            <p className="eyebrow text-charcoal/38">PROGRESS</p>
            <div className="mt-5 flex items-end gap-2"><span className="mono text-6xl font-bold tracking-[-.08em]">{progress}</span><span className="mb-2 text-sm text-charcoal/38">%</span></div>
          </div>
          <div className="mt-10 grid grid-cols-8 gap-1.5">
            {Array.from({ length: 48 }, (_, index) => <span key={index} className={`aspect-square rounded-[4px] ${index < completed ? "bg-sky" : index === completed ? "border-2 border-sky bg-ice" : "border border-charcoal/10 bg-white"}`} />)}
          </div>
          <Link href={`/${locale}/app/progress`} className="mt-7 flex items-center justify-between border-t border-charcoal/10 pt-4 text-sm font-bold">{mm ? "တိုးတက်မှုကြည့်မယ်" : "View progress"}<ArrowRight size={16} /></Link>
        </aside>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-3">
        {[{ icon: Utensils, label: "Protein", done: habits?.protein }, { icon: Droplets, label: "Water", done: habits?.water }, { icon: Moon, label: "Sleep", value: habits?.sleep_hours ? `${habits.sleep_hours}h` : "—" }].map((habit) => (
          <div key={habit.label} className="surface flex items-center justify-between p-5">
            <div className="flex items-center gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${habit.done ? "bg-sky" : "bg-charcoal/[.045]"}`}><habit.icon size={18} /></span><span className="text-sm font-bold">{habit.label}</span></div>
            <span className="mono text-sm text-charcoal/38">{"value" in habit ? habit.value : habit.done ? <Check size={18} className="text-aqua" /> : "—"}</span>
          </div>
        ))}
      </section>

      <Link href={`/${locale}/app/habits`} className="mt-3 flex min-h-12 items-center justify-between rounded-xl border border-charcoal/10 bg-white/70 px-4 text-sm font-bold">
        <span>{mm ? "ဒီနေ့ habits ကို မှတ်မယ်" : "Log today’s habits"}</span><ArrowRight size={16} />
      </Link>

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-charcoal/15 bg-white/45 px-4 py-3 text-xs text-charcoal/44"><WifiOff size={15} />{mm ? "Workout logs ကို device မှာအရင်သိမ်းပြီး online ပြန်ရတဲ့အခါ sync လုပ်မယ်" : "Workout logs save on your device first and sync when you reconnect."}</div>
    </div>
  );
}
