import { notFound } from "next/navigation";
import { ProgramStatusControl } from "@/components/admin/program-status";
import { getAdminCustomers } from "@/components/admin/data";
import { isLocale } from "@/lib/i18n";
import styles from "@/components/admin/admin.module.css";

export default async function CustomersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const customers = await getAdminCustomers();
  return <><div className={styles.pageHeader}><div><p className={styles.eyebrow}>People</p><h1 className={styles.pageTitle}>Customers.</h1><p className={styles.pageDescription}>See purchase state and manage each copied program without touching the master template.</p></div></div><section className={styles.panel}>{customers.length ? <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Customer</th><th>Language</th><th>Payment</th><th>Program</th><th>Access</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}><td><strong>{customer.display_name || "Unnamed customer"}</strong><small className="mono">{customer.id.slice(0, 8)}</small></td><td>{customer.preferred_locale === "en" ? "English" : "မြန်မာ"}</td><td>{customer.order ? <span className={styles.status} data-status={customer.order.status}>{customer.order.status.replaceAll("_", " ")}</span> : <span className={styles.muted}>No order</span>}</td><td>{customer.program ? <><strong>{customer.program.name_en || customer.program.name_mm}</strong><small>{customer.program.assigned_at ? new Date(customer.program.assigned_at).toLocaleDateString("en-GB") : "Assigned"}</small></> : <span className={styles.muted}>Not assigned</span>}</td><td>{customer.program && ["active", "paused", "completed"].includes(customer.program.status) ? <ProgramStatusControl initialStatus={customer.program.status as "active" | "paused" | "completed"} locale={locale} programId={customer.program.id} /> : <span className={styles.muted}>—</span>}</td></tr>)}</tbody></table></div> : <div className={styles.empty}><strong>No customers yet</strong>Signed-in customers will appear here.</div>}</section></>;
}

