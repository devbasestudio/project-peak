"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CircleUserRound, Dumbbell, LayoutDashboard, NotebookTabs, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const labels = {
  mm: {
    today: "ဒီနေ့",
    habits: "နေ့စဉ်မှတ်တမ်း",
    progress: "တိုးတက်မှု",
    account: "အကောင့်",
    admin: "Admin",
    memberArea: "12 ပတ် လေ့ကျင့်ရေး",
  },
  en: {
    today: "Today",
    habits: "Daily log",
    progress: "Progress",
    account: "Account",
    admin: "Admin",
    memberArea: "12 week training",
  },
};

export function AppShell({ children, locale, isAdmin, name, avatarUrl }: { children: React.ReactNode; locale: Locale; isAdmin: boolean; name: string; avatarUrl: string | null }) {
  const pathname = usePathname();
  const copy = labels[locale];
  const base = `/${locale}/app`;
  const links = [
    { href: base, label: copy.today, icon: Dumbbell, exact: true },
    { href: `${base}/habits`, label: copy.habits, icon: NotebookTabs },
    { href: `${base}/progress`, label: copy.progress, icon: BarChart3 },
    { href: `${base}/account`, label: copy.account, icon: CircleUserRound },
  ];
  const otherLocale = locale === "mm" ? "en" : "mm";

  return (
    <div lang={locale === "mm" ? "my" : "en"} className="min-h-screen bg-[#f4f6f5] text-charcoal">
      <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-[76px]">
          <Link href={base} className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-charcoal">
              <Image src="/brand/icon-gradient.svg" alt="" width={25} height={25} />
            </span>
            <span className="min-w-0">
              <strong className="block font-display text-sm font-bold tracking-[-.02em]">PROJECT PEAK</strong>
              <small className="mt-0.5 block truncate text-[10px] font-medium text-charcoal/45">{copy.memberArea}</small>
            </span>
          </Link>

          <nav aria-label="Member navigation" className="hidden items-center gap-1 rounded-xl bg-[#eef1f0] p-1 lg:flex">
            {links.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-10 items-center gap-2 rounded-lg px-4 text-xs font-semibold transition ${active ? "bg-white text-charcoal shadow-sm" : "text-charcoal/48 hover:text-charcoal"}`}
                >
                  <item.icon size={15} strokeWidth={active ? 2.2 : 1.7} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Link href={`/${locale}/admin`} className="hidden h-10 items-center gap-2 rounded-lg border border-charcoal/10 bg-white px-3 text-[11px] font-semibold sm:flex">
                <ShieldCheck size={15} />{copy.admin}<LayoutDashboard size={14} />
              </Link>
            ) : null}
            <Link
              href={`/${otherLocale}${pathname.replace(/^\/(mm|en)/, "")}`}
              className="grid h-10 min-w-12 place-items-center rounded-lg border border-charcoal/10 bg-white px-3 text-[10px] font-bold"
              aria-label={locale === "mm" ? "Switch to English" : "မြန်မာဘာသာသို့ ပြောင်းရန်"}
            >
              {locale === "mm" ? "EN" : "မြန်မာ"}
            </Link>
            <Link href={`${base}/account`} className="flex min-w-0 items-center gap-2 rounded-lg py-1 pl-1 pr-1 lg:hidden" aria-label={copy.account}>
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-sky text-[11px] font-bold ring-2 ring-white">
                {avatarUrl ? <Image src={avatarUrl} alt="" width={36} height={36} referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-28 truncate text-xs font-semibold sm:block">{name}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-68px)] w-full max-w-[1080px] px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:min-h-[calc(100vh-76px)] lg:px-8 lg:pb-16 lg:pt-10">
        {children}
      </main>

      <nav aria-label="Member navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-charcoal/10 bg-white/96 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(6,17,26,.06)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {links.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[66px] flex-col items-center justify-center gap-1.5 px-1 text-center text-[10px] font-semibold ${active ? "text-charcoal" : "text-charcoal/38"}`}
              >
                {active ? <span className="absolute left-1/2 top-0 h-1 w-8 -translate-x-1/2 rounded-b-full bg-sky" /> : null}
                <item.icon size={20} strokeWidth={active ? 2.35 : 1.65} />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
