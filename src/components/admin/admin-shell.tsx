"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Circle,
  CreditCard,
  Dumbbell,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/app/actions";
import type { Locale } from "@/lib/i18n";
import styles from "./admin.module.css";

type Props = {
  children: React.ReactNode;
  locale: Locale;
  name: string;
  email: string;
};

const navigation = [
  { href: "", label: "Overview", description: "Workspace summary", code: "01", icon: LayoutDashboard },
  { href: "/payments", label: "Payments", description: "Review KBZPay orders", code: "02", icon: CreditCard },
  { href: "/customers", label: "Customers", description: "Program access", code: "03", icon: Users },
  { href: "/templates", label: "Templates", description: "Build training screens", code: "04", icon: Dumbbell },
];

export function AdminShell({ children, locale, name, email }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const adminRoot = `/${locale}/admin`;
  const activeItem = [...navigation]
    .reverse()
    .find(({ href }) => (href ? pathname.startsWith(`${adminRoot}${href}`) : pathname === adminRoot))
    ?? navigation[0];
  const alternateLocale = locale === "en" ? "mm" : "en";
  const alternatePath = pathname.replace(/^\/(en|mm)(?=\/)/, `/${alternateLocale}`);

  return (
    <div className={styles.shell}>
      <button
        aria-label="Close navigation"
        className={styles.sidebarBackdrop}
        data-open={menuOpen}
        onClick={() => setMenuOpen(false)}
        type="button"
      />
      <aside className={styles.sidebar} data-open={menuOpen}>
        <div className={styles.brandRow}>
          <Link className={styles.brand} href={adminRoot} onClick={() => setMenuOpen(false)}>
            <span className={styles.brandMark}>
              <Image alt="" height={31} src="/brand/icon-gradient.svg" width={31} />
            </span>
            <span className={styles.brandCopy}>Coach studio<small>12 week program</small></span>
          </Link>
          <button aria-label="Close navigation" className={styles.menuButton} onClick={() => setMenuOpen(false)} type="button">
            <X size={20} />
          </button>
        </div>

        <div className={styles.railRule}><span>Workspace</span><span>Live</span></div>
        <nav className={styles.nav} aria-label="Admin navigation">
          {navigation.map(({ href, label, description, code, icon: Icon }) => {
            const target = `${adminRoot}${href}`;
            const active = href ? pathname.startsWith(target) : pathname === adminRoot;
            return (
              <Link className={styles.navLink} data-active={active} href={target} key={href} onClick={() => setMenuOpen(false)}>
                <span className={styles.navCode}>{code}</span>
                <span className={styles.navIcon}><Icon aria-hidden="true" size={18} strokeWidth={1.8} /></span>
                <span className={styles.navText}><strong>{label}</strong><small>{description}</small></span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.workspaceStatus}>
            <Circle aria-hidden="true" fill="currentColor" size={7} /><span>System operational</span><b>Live</b>
          </div>
          <div className={styles.viewer}>
            <span className={styles.viewerAvatar}>{name.slice(0, 1).toUpperCase()}</span>
            <span className={styles.viewerCopy}><strong>{name}</strong><small>{email}</small></span>
          </div>
          <form action={signOut.bind(null, locale)}>
            <button className={styles.signOut} type="submit"><LogOut aria-hidden="true" size={16} /> Sign out</button>
          </form>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarContext}>
            <button aria-label="Open navigation" className={styles.menuButton} onClick={() => setMenuOpen(true)} type="button">
              <Menu size={21} />
            </button>
            <span className={styles.topbarIndex}>{activeItem.code}</span>
            <div><div className={styles.topbarTitle}>{activeItem.label}</div><div className={styles.topbarMeta}>{activeItem.description}</div></div>
          </div>
          <div className={styles.topbarActions}>
            <Link className={styles.siteLink} href={`/${locale}`} target="_blank">View site <ExternalLink size={14} /></Link>
            <span className={styles.liveStatus}><i /> Production</span>
            <div className={styles.localeSwitch} aria-label="Language switcher">
              <Link data-active="true" href={pathname}>{locale === "mm" ? "မြန်မာ" : "EN"}</Link>
              <Link href={alternatePath}>{alternateLocale === "mm" ? "မြန်မာ" : "EN"}</Link>
            </div>
          </div>
        </header>
        <div className={styles.page}>{children}</div>
      </main>
    </div>
  );
}
