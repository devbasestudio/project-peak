"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CircleUserRound, Dumbbell, LayoutDashboard, NotebookTabs, ShieldCheck } from "lucide-react";
import { AscentMark } from "@/components/app-shell/ascent-mark";
import type { Locale } from "@/lib/i18n";

const labels = {
  mm: { today: "ဒီနေ့", habits: "အလေ့အကျင့်", progress: "တိုးတက်မှု", account: "အကောင့်", admin: "Admin" },
  en: { today: "Today", habits: "Habits", progress: "Progress", account: "Account", admin: "Admin" },
};

export function AppShell({ children, locale, isAdmin, name }: { children: React.ReactNode; locale: Locale; isAdmin: boolean; name: string }) {
  const pathname = usePathname();
  const copy = labels[locale];
  const base = `/${locale}/app`;
  const links = [
    { href: base, label: copy.today, icon: Dumbbell, exact: true, number: "01" },
    { href: `${base}/habits`, label: copy.habits, icon: NotebookTabs, number: "02" },
    { href: `${base}/progress`, label: copy.progress, icon: BarChart3, number: "03" },
    { href: `${base}/account`, label: copy.account, icon: CircleUserRound, number: "04" },
  ];

  return (
    <div lang={locale === "mm" ? "my" : "en"} className="min-h-screen bg-paper text-charcoal lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-charcoal/12 bg-[#fafdfd] lg:flex">
        <Link href={base} className="flex h-20 items-center gap-3 border-b border-charcoal/12 px-7">
          <Image src="/brand/icon-gradient.svg" alt="" width={34} height={34} />
          <div><span className="block font-display text-sm font-bold tracking-[-.02em]">PROJECT PEAK</span><span className="mono mt-0.5 block text-[8px] tracking-[.22em] text-charcoal/35">12 WEEK ASCENT</span></div>
        </Link>
        <div className="border-b border-charcoal/12 px-7 py-7">
          <AscentMark className="h-auto w-full text-charcoal" />
          <div className="mt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-[.18em] text-charcoal/35"><span>Base</span><span>Peak · 48</span></div>
        </div>
        <nav aria-label="Member navigation" className="px-4 py-5">
          {links.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`group grid min-h-14 grid-cols-[32px_1fr_auto] items-center border-b px-3 text-sm transition ${active ? "border-sky bg-sky text-charcoal" : "border-charcoal/8 text-charcoal/48 hover:bg-paper hover:text-charcoal"}`}><span className="mono text-[9px] opacity-55">{item.number}</span><span className="font-bold">{item.label}</span><item.icon size={16} strokeWidth={1.7} /></Link>;
          })}
          {isAdmin ? <Link href={`/${locale}/admin`} className="mt-6 grid min-h-12 grid-cols-[32px_1fr_auto] items-center border border-charcoal/15 px-3 text-xs font-bold"><ShieldCheck size={15} /><span>{copy.admin}</span><LayoutDashboard size={15} /></Link> : null}
        </nav>
        <div className="mt-auto border-t border-charcoal/12 px-7 py-6">
          <p className="mono text-[8px] uppercase tracking-[.2em] text-charcoal/30">Athlete</p><p className="mt-2 truncate text-sm font-bold">{name}</p><div className="mt-4 h-px bg-charcoal/10"><div className="h-px w-2/3 bg-sky" /></div>
        </div>
      </aside>

      <div className="lg:col-start-2">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-charcoal/12 bg-paper/92 px-4 backdrop-blur-xl sm:px-6 lg:h-20 lg:px-10">
          <Link href={base} className="flex items-center gap-2 lg:hidden"><Image src="/brand/icon-gradient.svg" alt="Project Peak" width={32} height={32} /><span className="font-display text-xs font-bold tracking-[.02em]">PROJECT PEAK</span></Link>
          <div className="hidden items-center gap-4 lg:flex"><span className="h-2 w-2 bg-sky" /><p className="mono text-[9px] font-bold uppercase tracking-[.22em] text-charcoal/38">Member training log</p></div>
          <Link href={`/${locale === "mm" ? "en" : "mm"}${pathname.replace(/^\/(mm|en)/, "")}`} className="grid min-h-10 min-w-14 place-items-center border border-charcoal/15 bg-white px-3 text-[10px] font-bold uppercase tracking-wider transition hover:border-charcoal/40">{locale === "mm" ? "EN" : "မြန်မာ"}</Link>
        </header>
        <main className="relative mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1320px] overflow-hidden px-4 pb-28 pt-6 sm:px-6 lg:min-h-[calc(100vh-80px)] lg:px-10 lg:pb-16 lg:pt-10">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[.032] [background-image:linear-gradient(rgba(6,17,26,1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,17,26,1)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="relative">{children}</div>
        </main>
      </div>

      <nav aria-label="Member navigation" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-charcoal/15 bg-[#fafdfd]/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {links.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[9px] font-bold ${active ? "text-charcoal" : "text-charcoal/35"}`}>{active ? <span className="absolute inset-x-3 top-0 h-1 bg-sky" /> : null}<item.icon size={18} strokeWidth={active ? 2.3 : 1.6} />{item.label}</Link>;
        })}
      </nav>
    </div>
  );
}
