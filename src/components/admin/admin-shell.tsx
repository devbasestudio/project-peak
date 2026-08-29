import Link from "next/link";
import { CreditCard, Dumbbell, LayoutDashboard, Users } from "lucide-react";
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
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/templates", label: "Program templates", icon: Dumbbell },
];

export function AdminShell({ children, locale, name, email }: Props) {
  const alternateLocale = locale === "en" ? "mm" : "en";
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href={`/${locale}/admin`}>
          <span className={styles.brandMark}>PP</span>
          <span>Project Peak<br /><small>Coach studio</small></span>
        </Link>
        <p className={styles.navLabel}>Workspace</p>
        <nav className={styles.nav} aria-label="Admin navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link className={styles.navLink} href={`/${locale}/admin${href}`} key={href}>
              <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.viewer}>
            <strong>{name}</strong>
            <span>{email}</span>
          </div>
          <form action={signOut.bind(null, locale)}>
            <button className={styles.signOut} type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <div className={styles.topbarTitle}>Admin workspace</div>
            <div className={styles.topbarMeta}>CONTROL ROOM · PROJECT PEAK</div>
          </div>
          <div className={styles.localeSwitch} aria-label="Language switcher">
            <Link href={`/${locale}/admin`}>{locale === "mm" ? "မြန်မာ" : "EN"}</Link>
            <Link href={`/${alternateLocale}/admin`}>{alternateLocale === "mm" ? "မြန်မာ" : "EN"}</Link>
          </div>
        </header>
        <div className={styles.page}>{children}</div>
      </main>
    </div>
  );
}

