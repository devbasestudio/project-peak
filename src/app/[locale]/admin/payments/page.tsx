import { notFound } from "next/navigation";
import { PaymentReview } from "@/components/admin/payment-review";
import { getAdminPayments } from "@/components/admin/data";
import { isLocale } from "@/lib/i18n";
import styles from "@/components/admin/admin.module.css";

export default async function PaymentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { orders, versions } = await getAdminPayments();
  return <><div className={styles.pageHeader}><div><p className={styles.eyebrow}>Manual KPay desk</p><h1 className={styles.pageTitle}>Payments.</h1><p className={styles.pageDescription}>Approve a verified submission once. The database copies the published program into the customer account.</p></div></div><section className={styles.panel}>{orders.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Customer</th><th>Order</th><th>Amount</th><th>Status</th><th>Review</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.customerName}</strong><small>{order.customer_note || "No note"}</small></td><td><strong className="mono">{order.reference_code}</strong><small>{new Date(order.submitted_at || order.created_at).toLocaleString("en-GB")}</small></td><td className="mono">{Number(order.amount_minor).toLocaleString()} {order.currency}</td><td><span className={styles.status} data-status={order.status}>{order.status.replaceAll("_", " ")}</span></td><td>{["awaiting_payment", "submitted"].includes(order.status) ? <PaymentReview locale={locale} orderId={order.id} versions={versions} /> : <span className={styles.muted}>{order.status === "approved" ? "Access assigned" : "Closed"}</span>}</td></tr>)}</tbody></table></div> : <div className={styles.empty}><strong>No payment orders yet</strong>Customer purchase requests will appear here.</div>}</section></>;
}

