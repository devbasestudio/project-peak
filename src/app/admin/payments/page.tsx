import { getRegistrations } from "@/lib/adminData";
import PaymentsClient from "./PaymentsClient";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const registrations = await getRegistrations();
  return <PaymentsClient registrations={registrations} />;
}
