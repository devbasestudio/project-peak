import { notFound } from "next/navigation";
import { PaymentReview } from "@/components/admin/payment-review";
import { getAdminPayments } from "@/components/admin/data";
import { isLocale } from "@/lib/i18n";
import styles from "@/components/admin/admin.module.css";

export default async function PaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { orders, versions } = await getAdminPayments();
  const pendingCount = orders.filter((order) => ["awaiting_payment", "submitted"].includes(order.status)).length;

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>{pendingCount} waiting for review</p>
          <h1 className={styles.pageTitle}>Payment desk.</h1>
          <p className={styles.pageDescription}>
            Match each KBZPay receipt to its reference code, then approve the correct published program. Approval creates an independent customer copy.
          </p>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>All payment orders</h2>
          <span className={styles.muted}>{orders.length} total · {pendingCount} open</span>
        </div>
        {orders.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Customer</th><th>Order</th><th>Amount</th><th>Status</th><th>Review</th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td data-label="Customer"><strong>{order.customerName}</strong><small>{order.customer_note || "No customer note"}</small></td>
                    <td data-label="Order"><strong className="mono">{order.reference_code}</strong><small>{new Date(order.submitted_at || order.created_at).toLocaleString("en-GB")}</small></td>
                    <td className="mono" data-label="Amount">{Number(order.amount_minor).toLocaleString()} {order.currency}</td>
                    <td data-label="Status"><span className={styles.status} data-status={order.status}>{order.status.replaceAll("_", " ")}</span></td>
                    <td data-label="Review">
                      {["awaiting_payment", "submitted"].includes(order.status) ? (
                        <PaymentReview locale={locale} orderId={order.id} versions={versions} />
                      ) : (
                        <span className={styles.muted}>{order.status === "approved" ? "Access assigned" : "Order closed"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.empty}><strong>No payment orders yet</strong>Customer purchase requests will appear here.</div>
        )}
      </section>
    </>
  );
}
