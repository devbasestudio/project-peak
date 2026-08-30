import Link from "next/link";
import { Circle, CreditCard, Dumbbell, LayoutDashboard, LogOut, Users } from "lucide-react";
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
  { href: "", label: "Overview", code: "01", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", code: "02", icon: Users },
  { href: "/payments", label: "Payments", code: "03", icon: CreditCard },
  { href: "/templates", label: "Program templates", code: "04", icon: Dumbbell },
];

export function AdminShell({ children, locale, name, email }: Props) {
  const alternateLocale = locale === "en" ? "mm" : "en";
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href={`/${locale}/admin`}>
          <span className={styles.brandMark}><span>PP</span><i /></span>
          <span className={styles.brandCopy}>Project Peak<small>Coach studio · 12W</small></span>
        </Link>
        <div className={styles.railRule}><span>Workspace</span><span>V1.0</span></div>
        <nav className={styles.nav} aria-label="Admin navigation">
          {navigation.map(({ href, label, code, icon: Icon }) => (
            <Link className={styles.navLink} href={`/${locale}/admin${href}`} key={href}>
              <span className={styles.navCode}>{code}</span>
              <span className={styles.navIcon}><Icon aria-hidden="true" size={15} strokeWidth={1.7} /></span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.workspaceStatus}><Circle aria-hidden="true" fill="currentColor" size={7} /><span>System ready</span><b>Live</b></div>
          <div className={styles.viewer}>
            <span className={styles.viewerAvatar}>{name.slice(0, 1).toUpperCase()}</span>
            <span className={styles.viewerCopy}><strong>{name}</strong><small>{email}</small></span>
          </div>
          <form action={signOut.bind(null, locale)}>
            <button className={styles.signOut} type="submit"><LogOut aria-hidden="true" size={13} /> Sign out</button>
          </form>
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarContext}>
            <span className={styles.topbarIndex}>PP / ADMIN</span>
            <div><div className={styles.topbarTitle}>Editorial control room</div><div className={styles.topbarMeta}>PROGRAM · CONTENT · ACCESS</div></div>
          </div>
          <div className={styles.topbarActions}>
            <span className={styles.liveStatus}><i /> Production</span>
            <div className={styles.localeSwitch} aria-label="Language switcher">
              <Link href={`/${locale}/admin`}>{locale === "mm" ? "မြန်မာ" : "EN"}</Link>
              <Link href={`/${alternateLocale}/admin`}>{alternateLocale === "mm" ? "မြန်မာ" : "EN"}</Link>
            </div>
          </div>
        </header>
        <div className={styles.page}>{children}</div>
      </main>
    </div>
  );
}
