import Link from "next/link";
import { getClients } from "@/lib/adminData";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const clients = await getClients();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="ph-users"
        title="Clients"
        subtitle="Every active client. Open one to edit their program and review weekly check-ins."
      />

      {clients.length === 0 ? (
        <Card>
          <EmptyState icon="ph-users" text="No clients yet. Approve a payment to get started." />
        </Card>
      ) : (
        <Card className="!p-0">
          <ul className="divide-y divide-[#eef2f0]">
            {clients.map((client) => (
              <li key={client.id}>
                <Link
                  href={client.canOpenProfile ? `/admin/client-view?id=${client.id}` : "/admin/payments"}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 no-underline transition hover:bg-[#f6f8f7]"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#eef2f0] text-base font-bold text-[#1c2b29]">
                      {(client.username || "C").charAt(0).toUpperCase()}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-bold text-[#1c2b29]">
                        {client.username || "Client"}
                      </span>
                      <span className="text-xs text-[#6b7a77]">{client.email}</span>
                      <span className="text-xs text-[#9aa8a4]">
                        {client.program_name || "No package"} {client.telegram_id ? `· TG ${client.telegram_id}` : ""}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    {client.payment_status && (
                      <span className="hidden rounded-full bg-[#eef2f0] px-2.5 py-1 text-[0.68rem] font-semibold capitalize text-[#6b7a77] sm:inline">
                        {client.payment_status.replace(/_/g, " ")}
                      </span>
                    )}
                    {client.duration_weeks ? (
                      <span className="hidden rounded-full bg-[#eef2f0] px-2.5 py-1 text-[0.68rem] font-semibold text-[#6b7a77] sm:inline">
                        {client.duration_weeks} wk program
                      </span>
                    ) : (
                      <span className="hidden rounded-full bg-[#fff4e6] px-2.5 py-1 text-[0.68rem] font-semibold text-[#b25b15] sm:inline">
                        {client.canOpenProfile ? "No program" : "Needs account"}
                      </span>
                    )}
                    <i className="ph ph-caret-right text-base text-[#b6c1bd]" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
