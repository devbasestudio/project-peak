"use client";

import { useMemo, useState } from "react";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import {
  Toast,
  actionButtonClass,
  useAdminAction,
} from "@/components/admin/useAdminAction";

function isPending(status: unknown) {
  return String(status || "").toLowerCase() === "pending";
}

function statusBadge(paymentStatus: string) {
  const s = String(paymentStatus || "awaiting_payment").toLowerCase();
  if (s === "approved" || s === "ready")
    return "bg-[#edf9f0] text-[#1d7a3a]";
  if (s === "rejected") return "bg-[#fdeee9] text-[#c0432b]";
  if (s === "awaiting_payment") return "bg-[#eef2f0] text-[#6b7a77]";
  return "bg-[#fff4e6] text-[#b25b15]";
}

export default function PaymentsClient({ registrations }: { registrations: any[] }) {
  const { state, pendingId, run } = useAdminAction();
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const list = useMemo(() => {
    if (filter === "pending") return registrations.filter((r) => isPending(r.payment_status) && r.payment_screenshot);
    return registrations;
  }, [registrations, filter]);

  const pendingCount = registrations.filter((r) => isPending(r.payment_status) && r.payment_screenshot).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="ph-receipt"
        title="Payments"
        subtitle="Review payment proofs and approve new client registrations."
        action={
          <div className="inline-flex rounded-xl border border-[#e6eae8] bg-white p-1">
            {(["pending", "all"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition ${
                  filter === key ? "bg-[#1c2b29] text-white" : "text-[#6b7a77]"
                }`}
              >
                {key}
                {key === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
              </button>
            ))}
          </div>
        }
      />

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon="ph-receipt"
            text={filter === "pending" ? "No pending payments right now." : "No registrations yet."}
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((reg) => {
            const approving = pendingId === `approve-${reg.id}`;
            return (
              <Card key={reg.id} className="!p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eef2f0] text-base font-bold text-[#1c2b29]">
                      {(reg.name || reg.username || "C").charAt(0).toUpperCase()}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-[#1c2b29]">
                          {reg.name || reg.username || "Client"}
                        </strong>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.64rem] font-bold capitalize ${statusBadge(
                            reg.payment_status,
                          )}`}
                        >
                          {String(reg.payment_status || "awaiting_payment").replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-xs text-[#6b7a77]">
                        {reg.program_name || "Custom program"} ·{" "}
                        {reg.telegram_id ? `TG ${reg.telegram_id}` : reg.email}
                      </span>
                      {reg.notes && (
                        <p className="mt-1 text-xs text-[#83928f]">{reg.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {reg.payment_screenshot && (
                      <a
                        href={
                          reg.payment_screenshot.startsWith("http")
                            ? reg.payment_screenshot
                            : `/${reg.payment_screenshot}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6eae8] bg-white px-3 py-2 text-sm font-semibold text-[#1c2b29] no-underline transition hover:bg-[#f6f8f7]"
                      >
                        <i className="ph ph-image text-base" /> Receipt
                      </a>
                    )}
                    {isPending(reg.payment_status) && reg.payment_screenshot && (
                      <button
                        type="button"
                        disabled={approving}
                        className={actionButtonClass}
                        onClick={() =>
                          run(`approve-${reg.id}`, "Payment approved — workspace opened", () =>
                            fetch("/api/admin/approve-registration", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ registrationId: reg.id }),
                            }),
                          )
                        }
                      >
                        <i className="ph ph-check-circle text-base" />
                        {approving ? "Approving…" : "Approve"}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Toast state={state} />
    </div>
  );
}
