import Link from "next/link";
import { ArrowUpRight, CreditCard, Dumbbell, LayoutTemplate, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getAdminOverview } from "@/components/admin/data";
import { isLocale } from "@/lib/i18n";
import styles from "@/components/admin/admin.module.css";

export default async function AdminOverviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { stats, recentOrders } = await getAdminOverview();
  const cards = [
    { label: "Customers", value: stats.customers, caption: "Registered profiles", icon: Users },
    { label: "Active programs", value: stats.activePrograms, caption: "Currently training", icon: Dumbbell },
    { label: "Payment queue", value: stats.pendingPayments, caption: "Waiting for review", icon: CreditCard },
    { label: "Templates", value: stats.templates, caption: "Editable program systems", icon: LayoutTemplate },
  ];

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Today&apos;s workspace</p>
          <h1 className={styles.pageTitle}>Run your program.</h1>
          <p className={styles.pageDescription}>
            See what needs attention, approve customer access, and keep the 12-week experience up to date.
          </p>
        </div>
        <Link className={styles.button} href={`/${locale}/admin/templates`}>
          Open template studio <ArrowUpRight size={15} />
        </Link>
      </div>

      <div className={styles.statsGrid}>
        {cards.map(({ label, value, caption, icon: Icon }) => (
          <article className={styles.statCard} key={label}>
            <div className={styles.statTop}>
              <span>{label}</span>
              <span className={styles.statIcon}><Icon size={16} /></span>
            </div>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statCaption}>{caption}</div>
          </article>
        ))}
      </div>

      <div className={styles.dashboardGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Recent payment orders</h2>
            <Link href={`/${locale}/admin/payments`}>Review all →</Link>
          </div>
          {recentOrders.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Customer</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td data-label="Customer"><strong>{order.customerName}</strong><small>{new Date(order.created_at).toLocaleDateString("en-GB")}</small></td>
                      <td className="mono" data-label="Reference">{order.reference_code}</td>
                      <td className="mono" data-label="Amount">{Number(order.amount_minor).toLocaleString()} {order.currency}</td>
                      <td data-label="Status"><span className={styles.status} data-status={order.status}>{order.status.replaceAll("_", " ")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.empty}><strong>No payment orders yet</strong>New orders will appear here.</div>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}><h2>Quick actions</h2></div>
          <div className={`${styles.panelBody} ${styles.stack}`}>
            <Link className={styles.quickLink} href={`/${locale}/admin/payments`}>
              <span><strong>Approve access</strong><small>Review KBZPay submissions</small></span><ArrowUpRight size={16} />
            </Link>
            <Link className={styles.quickLink} href={`/${locale}/admin/customers`}>
              <span><strong>Customer programs</strong><small>Pause or resume access</small></span><ArrowUpRight size={16} />
            </Link>
            <Link className={styles.quickLink} href={`/${locale}/admin/templates`}>
              <span><strong>Edit the program</strong><small>Build bilingual screens</small></span><ArrowUpRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
