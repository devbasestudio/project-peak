import Link from "next/link";
import { ArrowUpRight, CreditCard, Dumbbell, LayoutTemplate, Users } from "lucide-react";
import { getAdminOverview } from "@/components/admin/data";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import styles from "@/components/admin/admin.module.css";

export default async function AdminOverviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { stats, recentOrders } = await getAdminOverview();
  const cards = [
    { label: "Customers", value: stats.customers, caption: "Registered profiles", icon: Users },
    { label: "Active programs", value: stats.activePrograms, caption: "Currently training", icon: Dumbbell },
    { label: "Payment queue", value: stats.pendingPayments, caption: "Needs a review", icon: CreditCard },
    { label: "Templates", value: stats.templates, caption: "Editable program systems", icon: LayoutTemplate },
  ];
  return (
    <>
      <div className={styles.pageHeader}>
        <div><p className={styles.eyebrow}>Coach control room</p><h1 className={styles.pageTitle}>The program,<br />at a glance.</h1><p className={styles.pageDescription}>Review payments, manage customer access, and shape every training screen from one quiet workspace.</p></div>
        <Link className={styles.button} href={`/${locale}/admin/templates`}>Open template studio <ArrowUpRight size={15} /></Link>
      </div>
      <div className={styles.statsGrid}>{cards.map(({ label, value, caption, icon: Icon }) => <article className={styles.statCard} key={label}><div className={styles.statTop}><span>{label}</span><span className={styles.statIcon}><Icon size={16} /></span></div><div className={styles.statValue}>{String(value).padStart(2, "0")}</div><div className={styles.statCaption}>{caption}</div></article>)}</div>
      <div className={styles.dashboardGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}><h2>Recent payment orders</h2><Link href={`/${locale}/admin/payments`}>Review all →</Link></div>
          {recentOrders.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Customer</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead><tbody>{recentOrders.map((order) => <tr key={order.id}><td><strong>{order.customerName}</strong><small>{new Date(order.created_at).toLocaleDateString("en-GB")}</small></td><td className="mono">{order.reference_code}</td><td className="mono">{Number(order.amount_minor).toLocaleString()} {order.currency}</td><td><span className={styles.status} data-status={order.status}>{order.status.replaceAll("_", " ")}</span></td></tr>)}</tbody></table></div> : <div className={styles.empty}><strong>No payment orders yet</strong>New orders will appear here.</div>}
        </section>
        <section className={styles.panel}><div className={styles.panelHeader}><h2>Quick actions</h2></div><div className={`${styles.panelBody} ${styles.stack}`}><Link className={styles.quickLink} href={`/${locale}/admin/payments`}><span><strong>Approve access</strong><small>Review KPay submissions</small></span><ArrowUpRight size={16} /></Link><Link className={styles.quickLink} href={`/${locale}/admin/customers`}><span><strong>Customer programs</strong><small>Pause or resume access</small></span><ArrowUpRight size={16} /></Link><Link className={styles.quickLink} href={`/${locale}/admin/templates`}><span><strong>Edit program</strong><small>Build bilingual screens</small></span><ArrowUpRight size={16} /></Link></div></section>
      </div>
    </>
  );
}

