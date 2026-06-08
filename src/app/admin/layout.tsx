import { redirect } from "next/navigation";
import { decrypt } from "@/lib/session";
import { getPendingPaymentCount } from "@/lib/adminData";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await decrypt();

  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const pendingPayments = await getPendingPaymentCount();

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-[#1c2b29]">
      <AdminSidebar username={session.username} pendingPayments={pendingPayments} />
      <main className="md:pl-60">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
