"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CircleUserRound, Dumbbell, LayoutDashboard, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const labels = {
  mm: { today: "ဒီနေ့", progress: "တိုးတက်မှု", account: "အကောင့်", admin: "Admin" },
  en: { today: "Today", progress: "Progress", account: "Account", admin: "Admin" },
};

export function AppShell({ children, locale, isAdmin, name }: { children: React.ReactNode; locale: Locale; isAdmin: boolean; name: string }) {
  const pathname = usePathname();
  const copy = labels[locale];
  const links = [
    { href: `/${locale}/app`, label: copy.today, icon: Dumbbell },
    { href: `/${locale}/app/progress`, label: copy.progress, icon: BarChart3 },
    { href: `/${locale}/app/account`, label: copy.account, icon: CircleUserRound },
  ];

  return (
    <div className="min-h-screen bg-[#edf4f6] text-charcoal lg:grid lg:grid-cols-[236px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] flex-col border-r border-white/8 bg-charcoal p-5 text-white lg:flex">
        <Link href={`/${locale}/app`} className="flex items-center gap-3 border-b border-white/8 pb-6">
          <Image src="/brand/icon-gradient.svg" alt="" width={36} height={36} />
          <span className="font-display text-sm font-bold">PROJECT PEAK</span>
        </Link>
        <nav className="mt-8 space-y-2">
          {links.map((item) => {
            const active = pathname === item.href;
            return <Link key={item.href} href={item.href} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? "bg-sky text-charcoal" : "text-white/48 hover:bg-white/5 hover:text-white"}`}><item.icon size={18} />{item.label}</Link>;
          })}
          {isAdmin ? <Link href={`/${locale}/admin`} className="mt-6 flex min-h-12 items-center gap-3 rounded-xl border border-sky/25 px-3 text-sm font-semibold text-sky"><ShieldCheck size={18} />{copy.admin}</Link> : null}
        </nav>
        <div className="mt-auto rounded-xl border border-white/8 bg-white/[.035] p-3">
          <p className="text-xs text-white/35">Signed in as</p>
          <p className="mt-1 truncate text-sm font-semibold">{name}</p>
        </div>
      </aside>

      <div className="lg:col-start-2">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-charcoal/8 bg-[#edf4f6]/85 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-10">
          <Link href={`/${locale}/app`} className="flex items-center gap-2 lg:hidden"><Image src="/brand/icon-gradient.svg" alt="Project Peak" width={34} height={34} /><span className="font-display text-sm font-bold">PROJECT PEAK</span></Link>
          <div className="hidden lg:block"><p className="eyebrow text-charcoal/35">MEMBER PROGRAM</p></div>
          <Link href={`/${locale === "mm" ? "en" : "mm"}${pathname.replace(/^\/(mm|en)/, "")}`} className="rounded-lg border border-charcoal/10 bg-white px-3 py-2 text-xs font-bold">{locale === "mm" ? "EN" : "မြန်မာ"}</Link>
        </header>
        <main className="mx-auto min-h-[calc(100vh-65px)] w-full max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>
      </div>

      <nav className="fixed inset-x-3 bottom-[calc(.75rem+env(safe-area-inset-bottom))] z-50 flex items-center justify-around rounded-2xl border border-charcoal/10 bg-white/92 p-2 shadow-[0_18px_50px_rgba(6,17,26,.16)] backdrop-blur-xl lg:hidden">
        {links.map((item) => {
          const active = pathname === item.href;
          return <Link key={item.href} href={item.href} className={`flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold ${active ? "bg-charcoal text-white" : "text-charcoal/42"}`}><item.icon size={18} />{item.label}</Link>;
        })}
        {isAdmin ? <Link href={`/${locale}/admin`} className="flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold text-aqua"><LayoutDashboard size={18} />Admin</Link> : null}
      </nav>
    </div>
  );
}
