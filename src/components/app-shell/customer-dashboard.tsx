"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Copy, Droplets, LockKeyhole, Moon, Play, Send, Utensils, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { createPurchaseOrder } from "@/app/actions";
import { AscentMark, AscentRule } from "@/components/app-shell/ascent-mark";
import { ProgramBlocks, type ProgramBlock } from "@/components/app-shell/program-blocks";
import type { Locale } from "@/lib/i18n";

type Order = { reference_code: string; status: string; amount_minor: number; currency: string } | null;
type Program = { id: string; status: string; name_mm: string; name_en: string; completed: number; hasBaseline: boolean } | null;

export function CustomerDashboard({ locale, order, program, email, habits, programBlocks }: { locale: Locale; order: Order; program: Program; email: string; habits: { protein: boolean; water: boolean; sleep_hours: number | null } | null; programBlocks: ProgramBlock[] }) {
  const [pending, setPending] = useState(false);
  const mm = locale === "mm";

  if (!program) {
    return (
      <div className="mx-auto max-w-6xl">
        <header className="grid gap-6 border-b-2 border-charcoal pb-8 lg:grid-cols-[1fr_280px] lg:items-end">
          <div><p className="eyebrow text-charcoal/42">MEMBER ACCESS · PROJECT PEAK</p><h1 className="mt-4 max-w-4xl font-display text-5xl font-bold leading-[.9] tracking-[-.07em] sm:text-7xl lg:text-8xl">{order ? (mm ? "အတည်ပြုချက်ကို စောင့်နေတယ်" : "Your ascent is being prepared") : (mm ? "အခုကစပြီး တက်မယ်" : "Begin the ascent")}</h1></div>
          <AscentMark className="hidden w-full text-charcoal lg:block" />
        </header>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-charcoal/58" lang={mm ? "my" : "en"}>{mm ? "KPay payment ကို manual verify လုပ်ပြီးတာနဲ့ ကိုယ့်အတွက်သီးသန့် program copy တစ်ခုကိုဖွင့်ပေးမယ်" : "After your KPay payment is verified, an independent copy of the complete program opens for you."}</p>

        {!order ? (
          <form action={async () => { setPending(true); try { await createPurchaseOrder(locale); } finally { setPending(false); } }} className="mt-10 grid border-y border-charcoal/20 bg-white lg:grid-cols-[1fr_320px]">
            <div className="p-6 sm:p-10"><p className="mono text-[10px] font-bold uppercase tracking-[.22em] text-charcoal/35">12 weeks · 48 sessions · home workout</p><p className="mono mt-8 text-6xl font-bold tracking-[-.09em] sm:text-8xl">75,000</p><p className="mt-1 text-sm font-bold uppercase tracking-[.18em] text-charcoal/40">MMK · One complete program</p><p className="mt-8 max-w-xl text-sm leading-7 text-charcoal/55">{mm ? "Google account နဲ့ချိတ်ထားတဲ့ purchase reference code တစ်ခုထုတ်ပြီး payment screenshot နဲ့အတူ ပို့မယ်" : "Create a purchase reference tied to your Google account, then send it with your payment screenshot."}</p></div>
            <div className="flex flex-col justify-between border-t border-charcoal/15 bg-sky p-6 lg:border-l lg:border-t-0 lg:p-8"><span className="mono text-[10px] font-bold tracking-[.2em]">STEP 01 / 03</span><AscentMark className="my-12 w-full text-charcoal" /><button disabled={pending} className="flex min-h-14 items-center justify-between border-2 border-charcoal bg-charcoal px-5 text-sm font-bold text-white disabled:opacity-60">{pending ? (mm ? "လုပ်နေတယ်…" : "Creating…") : (mm ? "Reference ထုတ်မယ်" : "Create reference")}<ArrowRight size={17} /></button></div>
          </form>
        ) : (
          <section className="mt-10 overflow-hidden border-y border-charcoal/20 bg-white">
            <div className="grid lg:grid-cols-[minmax(300px,390px)_1fr]">
              <div className="relative overflow-hidden bg-[#0d5aad] p-5 sm:p-7">
                <div aria-hidden className="absolute -right-12 -top-12 h-40 w-40 rotate-45 border border-white/20" />
                <div className="relative flex items-center justify-between gap-4 pb-4 text-white">
                  <div><p className="mono text-[9px] font-bold uppercase tracking-[.18em] text-white/55">PAYMENT / 01</p><p className="mt-1 text-lg font-bold">KBZPay QR</p></div>
                  <div className="border border-white/25 px-3 py-2 text-right"><p className="mono text-lg font-bold">75,000</p><p className="mono text-[8px] tracking-[.16em] text-white/55">MMK</p></div>
                </div>
                <div className="relative border border-white/25 bg-white p-2 shadow-[0_24px_70px_rgba(0,0,0,.22)]">
                  <Image src="/payment/kbzpay-project-peak.jpg" alt="KBZPay QR code for Project Peak payment to Thet Naing Htun" width={828} height={1228} className="h-auto w-full" priority />
                </div>
                <p className="relative mt-4 text-center text-[11px] font-semibold leading-5 text-white/70" lang={mm ? "my" : "en"}>{mm ? "KBZPay app နဲ့ QR ကို scan ဖတ်ပြီး 75,000 MMK ပေးချေပါ" : "Scan with the KBZPay app and pay 75,000 MMK"}</p>
              </div>

              <div className="p-6 sm:p-9 lg:p-10">
                <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow text-charcoal/42">PURCHASE REFERENCE</p><p className="mt-2 text-sm text-charcoal/50" lang={mm ? "my" : "en"}>{mm ? "Screenshot ပို့တဲ့အခါ ဒီ code ကို တစ်ပါတည်းပို့ပါ" : "Include this code when you send your payment screenshot."}</p></div><span className="border border-charcoal/15 bg-sky px-3 py-1 text-[9px] font-bold uppercase tracking-wider">{order.status.replaceAll("_", " ")}</span></div>
                <button type="button" onClick={() => { navigator.clipboard.writeText(order.reference_code); toast.success(mm ? "Reference copy ကူးပြီးပြီ" : "Reference copied"); }} className="mt-6 flex w-full items-center justify-between border-y-2 border-charcoal bg-paper px-2 py-5 text-left transition hover:bg-ice"><span className="mono text-3xl font-bold tracking-[-.05em] sm:text-5xl">{order.reference_code}</span><span className="grid h-10 w-10 shrink-0 place-items-center border border-charcoal/15 bg-white"><Copy size={17} /></span></button>

                <ol className="mt-7 grid border-t border-charcoal/15 sm:grid-cols-3">
                  <li className="border-b border-charcoal/15 py-4 pr-4 sm:border-b-0 sm:border-r"><span className="mono mb-2 block text-[9px] font-bold text-sky">01 · SCAN</span><p className="text-sm leading-6 text-charcoal/62" lang={mm ? "my" : "en"}>{mm ? "QR scan ဖတ်ပြီး 75,000 MMK ပေးချေပါ" : "Scan the QR and pay 75,000 MMK."}</p></li>
                  <li className="border-b border-charcoal/15 py-4 sm:border-b-0 sm:border-r sm:px-4"><span className="mono mb-2 block text-[9px] font-bold text-sky">02 · CAPTURE</span><p className="text-sm leading-6 text-charcoal/62" lang={mm ? "my" : "en"}>{mm ? "ငွေလွှဲအောင်မြင်တဲ့ screenshot ကိုသိမ်းပါ" : "Save the successful payment screenshot."}</p></li>
                  <li className="py-4 sm:pl-4"><span className="mono mb-2 block text-[9px] font-bold text-sky">03 · SEND</span><p className="text-sm leading-6 text-charcoal/62" lang={mm ? "my" : "en"}>{mm ? "Screenshot + reference ကို Telegram ပို့ပါ" : "Send the screenshot and reference on Telegram."}</p></li>
                </ol>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border border-dashed border-charcoal/20 bg-paper px-4 py-3"><span className="mono text-[9px] font-bold uppercase tracking-[.12em] text-charcoal/38">SIGNED-IN EMAIL</span><span className="break-all text-xs font-semibold">{email}</span></div>
                <a href="https://t.me/wayneax21" target="_blank" rel="noreferrer" className="mt-5 flex min-h-14 w-full items-center justify-between border-2 border-charcoal bg-charcoal px-5 text-sm font-bold text-white transition hover:border-sky hover:bg-sky hover:text-charcoal"><Send size={17} /><span>{mm ? "Payment proof ကို @wayneax21 ဆီပို့မယ်" : "Send payment proof to @wayneax21"}</span><ArrowRight size={17} /></a>
              </div>
            </div>
            <aside className="grid gap-4 border-t border-charcoal/15 bg-paper px-6 py-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-9">
              <span className="grid h-10 w-10 place-items-center border border-charcoal/15 bg-white"><LockKeyhole size={18} /></span>
              <div><p className="text-sm font-bold" lang={mm ? "my" : "en"}>{mm ? "Admin အတည်ပြုပြီးတာနဲ့ ကိုယ်ပိုင် program ဖွင့်ပေးမယ်" : "Your personal program opens after admin approval."}</p><p className="mt-1 text-xs leading-5 text-charcoal/48" lang={mm ? "my" : "en"}>{mm ? "အတည်ပြုပြီးရင် baseline test ကနေ စတင်နိုင်ပါပြီ" : "Once approved, your 12-week journey starts with the baseline test."}</p></div>
              <span className="mono text-[9px] font-bold uppercase tracking-[.16em] text-charcoal/35">Secure · Manual verify</span>
            </aside>
          </section>
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
    <div className="mx-auto max-w-6xl">
      <ProgramBlocks locale={locale} blocks={programBlocks} />
      <header className="flex items-end justify-between gap-5 border-b-2 border-charcoal pb-4"><div><p className="eyebrow text-charcoal/38">PHASE {phase} · WEEK {week}</p><p className="mt-2 text-sm font-bold">{mm ? program.name_mm : program.name_en}</p></div><p className="mono text-xs font-bold">{String(completed).padStart(2, "0")} / 48</p></header>

      <section className="grid border-b border-charcoal/20 bg-white lg:grid-cols-[1fr_340px]">
        <article className="relative min-h-[430px] overflow-hidden p-6 sm:p-10 lg:min-h-[520px]">
          <div aria-hidden className="absolute bottom-0 right-0 h-full w-2/5 bg-sky [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div><p className="mono text-[10px] font-bold uppercase tracking-[.22em] text-charcoal/40">Next checkpoint</p><div className="mt-5 flex items-start gap-4"><span className="font-display text-8xl font-bold leading-none tracking-[-.1em] sm:text-[10rem]">{String(nextDay).padStart(2, "0")}</span><span className="mt-3 border-l border-charcoal/20 pl-4 text-xs font-bold uppercase tracking-[.16em] [writing-mode:vertical-rl]">Session</span></div></div>
            <div className="relative z-10 mt-12"><h1 className="font-display text-5xl font-bold leading-[.88] tracking-[-.07em] sm:text-7xl lg:text-8xl">{dayType}</h1><p className="mt-4 text-sm text-charcoal/50">{48 - completed} {mm ? "sessions ကျန်" : "sessions to the peak"}</p><Link href={program.hasBaseline ? `/${locale}/app/workout` : `/${locale}/app/baseline`} className="mt-8 flex min-h-14 max-w-md items-center justify-between border-2 border-charcoal bg-charcoal px-5 text-sm font-bold text-white"><Play size={17} fill="currentColor" />{program.hasBaseline ? (mm ? "ဒီနေ့ session စမယ်" : "Start this session") : (mm ? "Baseline အရင်စမယ်" : "Start baseline first")}<ArrowRight size={17} /></Link></div>
          </div>
        </article>

        <aside className="border-t border-charcoal/15 bg-paper p-6 lg:border-l lg:border-t-0 lg:p-8">
          <p className="eyebrow text-charcoal/36">ASCENT LOG</p><div className="mt-5 flex items-end gap-2"><span className="mono text-7xl font-bold tracking-[-.09em]">{progress}</span><span className="mb-3 text-xs font-bold">%</span></div><AscentMark className="mt-8 w-full text-charcoal" /><div className="mt-6"><AscentRule completed={completed} /></div><div className="mt-5 flex justify-between text-[9px] font-bold uppercase tracking-[.16em] text-charcoal/35"><span>Session 01</span><span>Peak 48</span></div><Link href={`/${locale}/app/progress`} className="mt-8 flex min-h-12 items-center justify-between border-t border-charcoal/20 pt-4 text-sm font-bold">{mm ? "တိုးတက်မှုအကုန်ကြည့်မယ်" : "Open the training log"}<ArrowRight size={16} /></Link>
        </aside>
      </section>

      <section className="mt-8 border-t-2 border-charcoal bg-white">
        <div className="grid border-b border-charcoal/12 px-4 py-3 sm:grid-cols-[1fr_auto] sm:px-6"><p className="eyebrow text-charcoal/38">TODAY · HABIT CHECK</p><Link href={`/${locale}/app/habits`} className="mt-2 flex items-center gap-2 text-xs font-bold sm:mt-0">{mm ? "မှတ်မယ်" : "Edit log"}<ArrowRight size={14} /></Link></div>
        <div className="grid sm:grid-cols-3">
          <HabitLine icon={Utensils} label="Protein" value={habits?.protein ? <Check size={18} /> : "—"} done={Boolean(habits?.protein)} />
          <HabitLine icon={Droplets} label="Water" value={habits?.water ? <Check size={18} /> : "—"} done={Boolean(habits?.water)} />
          <HabitLine icon={Moon} label="Sleep" value={habits?.sleep_hours ? `${habits.sleep_hours}h` : "—"} />
        </div>
      </section>
      <div className="mt-4 flex items-center gap-3 border border-dashed border-charcoal/20 bg-paper px-4 py-3 text-[11px] text-charcoal/45"><WifiOff size={14} />{mm ? "Workout logs ကို device မှာအရင်သိမ်းပြီး online ပြန်ရတဲ့အခါ sync လုပ်မယ်" : "Workout logs save on this device first, then sync when your signal returns."}</div>
    </div>
  );
}

function HabitLine({ icon: Icon, label, value, done = false }: { icon: typeof Utensils; label: string; value: React.ReactNode; done?: boolean }) {
  return <div className="flex min-h-24 items-center justify-between border-b border-charcoal/12 px-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><div className="flex items-center gap-3"><Icon size={17} /><span className="text-sm font-bold">{label}</span></div><span className={`mono grid min-h-9 min-w-9 place-items-center border px-2 text-sm font-bold ${done ? "border-sky bg-sky" : "border-charcoal/12"}`}>{value}</span></div>;
}
