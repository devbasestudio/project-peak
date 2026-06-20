"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

function receiptUrl(path: unknown) {
  const value = String(path || "");
  if (!value) return "";
  return value.startsWith("http") ? value : `/${value.replace(/^\/+/, "")}`;
}

export default function PaymentsClient({ registrations }: { registrations: any[] }) {
  const router = useRouter();
  const { state, pendingId, run } = useAdminAction();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [previewUrl, setPreviewUrl] = useState("");

  const list = useMemo(() => {
    if (filter === "pending") return registrations.filter((r) => isPending(r.payment_status) && r.payment_screenshot);
    return registrations;
  }, [registrations, filter]);

  const pendingCount = registrations.filter((r) => isPending(r.payment_status) && r.payment_screenshot).length;

  async function runAndRefresh(id: string, successLabel: string, request: () => Promise<Response>) {
    await run(id, successLabel, request);
    router.refresh();
  }

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
            const rejecting = pendingId === `reject-${reg.id}`;
            const receipt = receiptUrl(reg.payment_screenshot);
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
                    {receipt && (
                      <button
                        type="button"
                        onClick={() => setPreviewUrl(receipt)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6eae8] bg-white px-3 py-2 text-sm font-semibold text-[#1c2b29] no-underline transition hover:bg-[#f6f8f7]"
                      >
                        <i className="ph ph-image text-base" /> Receipt
                      </button>
                    )}
                    {isPending(reg.payment_status) && reg.payment_screenshot && (
                      <>
                        <button
                          type="button"
                          disabled={approving || rejecting}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#f4c7bd] bg-[#fdeee9] px-4 py-2.5 text-sm font-bold text-[#c0432b] transition hover:bg-[#f9ded6] disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() =>
                            runAndRefresh(`reject-${reg.id}`, "Payment rejected", () =>
                              fetch("/api/admin/reject-registration", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ registrationId: reg.id }),
                              }),
                            )
                          }
                        >
                          <i className="ph ph-x-circle text-base" />
                          {rejecting ? "Rejecting…" : "Reject"}
                        </button>
                        <button
                          type="button"
                          disabled={approving || rejecting}
                          className={actionButtonClass}
                          onClick={() =>
                            runAndRefresh(`approve-${reg.id}`, "Payment approved — workspace opened", () =>
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
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10211f]/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Payment receipt preview"
          onClick={() => setPreviewUrl("")}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e6eae8] px-4 py-3">
              <strong className="text-sm font-bold text-[#1c2b29]">Payment receipt</strong>
              <button
                type="button"
                onClick={() => setPreviewUrl("")}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#eef2f0] text-[#1c2b29] transition hover:bg-[#e3e9e6]"
                aria-label="Close receipt preview"
              >
                <i className="ph ph-x text-lg" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-[#f6f8f7] p-4">
              <img
                src={previewUrl}
                alt="Payment receipt preview"
                className="max-h-[78vh] max-w-full rounded-xl object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      <Toast state={state} />
    </div>
  );
}
