import { notFound } from "next/navigation";
import { ProgramStatusControl } from "@/components/admin/program-status";
import { getAdminCustomers } from "@/components/admin/data";
import { isLocale } from "@/lib/i18n";
import styles from "@/components/admin/admin.module.css";

export default async function CustomersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const customers = await getAdminCustomers();
  const activeCount = customers.filter((customer) => customer.program?.status === "active").length;

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>{customers.length} customer profiles</p>
          <h1 className={styles.pageTitle}>Customer access.</h1>
          <p className={styles.pageDescription}>
            Check payment and assignment status in one place. Pausing or completing a customer program never changes the master template.
          </p>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Program members</h2>
          <span className={styles.muted}>{activeCount} actively training</span>
        </div>
        {customers.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Customer</th><th>Language</th><th>Payment</th><th>Program</th><th>Access</th></tr></thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td data-label="Customer"><strong>{customer.display_name || "Unnamed customer"}</strong><small className="mono">ID · {customer.id.slice(0, 8)}</small></td>
                    <td data-label="Language">{customer.preferred_locale === "en" ? "English" : "မြန်မာ"}</td>
                    <td data-label="Payment">
                      {customer.order ? <span className={styles.status} data-status={customer.order.status}>{customer.order.status.replaceAll("_", " ")}</span> : <span className={styles.muted}>No order</span>}
                    </td>
                    <td data-label="Program">
                      {customer.program ? (
                        <><strong>{customer.program.name_en || customer.program.name_mm}</strong><small>{customer.program.assigned_at ? `Assigned ${new Date(customer.program.assigned_at).toLocaleDateString("en-GB")}` : "Assigned"}</small></>
                      ) : <span className={styles.muted}>Not assigned</span>}
                    </td>
                    <td data-label="Access">
                      {customer.program && ["active", "paused", "completed"].includes(customer.program.status) ? (
                        <ProgramStatusControl initialStatus={customer.program.status as "active" | "paused" | "completed"} locale={locale} programId={customer.program.id} />
                      ) : <span className={styles.muted}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.empty}><strong>No customers yet</strong>Signed-in customers will appear here.</div>
        )}
      </section>
    </>
  );
}
