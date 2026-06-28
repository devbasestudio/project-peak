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

function intakeRows(registration: any) {
  const answers =
    registration?.intake_answers && typeof registration.intake_answers === "object"
      ? registration.intake_answers
      : {};
  const rows = Object.entries(answers).map(([key, raw]) => {
    const answer = raw && typeof raw === "object" ? (raw as Record<string, any>) : { value: raw };
    return {
      key,
      label: String(answer.label || key).replace(/_/g, " "),
      type: String(answer.type || ""),
      value: answer.value ?? answer.fileUrl ?? "",
      fileUrl: answer.fileUrl || (String(answer.type || "") === "photo" ? answer.value : ""),
    };
  });

  const existingKeys = new Set(rows.map((row) => row.key));
  [
    { key: "age", label: "Age", value: registration.age },
    { key: "height", label: "Height", value: registration.height },
    { key: "weight", label: "Weight", value: registration.weight },
    { key: "phone", label: "Phone", value: registration.phone },
  ].forEach((item) => {
    if (!existingKeys.has(item.key) && item.value !== null && item.value !== undefined && String(item.value).trim()) {
      rows.push({ ...item, type: "text", fileUrl: "" });
    }
  });

  return rows.filter((row) => String(row.value || row.fileUrl || "").trim());
}

function intakePhotos(registration: any) {
  const answers =
    registration?.intake_answers && typeof registration.intake_answers === "object"
      ? registration.intake_answers
      : {};
  const photos = [
    { label: "Front photo", url: registration.photo_front },
    { label: "Back photo", url: registration.photo_back },
    { label: "Side photo", url: registration.photo_side },
    ...Object.entries(answers)
      .map(([key, raw]) => {
        const answer = raw && typeof raw === "object" ? (raw as Record<string, any>) : null;
        if (!answer || String(answer.type || "") !== "photo") return null;
        return {
          label: String(answer.label || key).replace(/\bbody\b/gi, "").replace(/\s+/g, " ").trim(),
          url: answer.fileUrl || answer.value,
        };
      })
      .filter(Boolean) as Array<{ label: string; url: string }>,
  ]
    .map((photo) => ({ ...photo, url: receiptUrl(photo.url) }))
    .filter((photo) => photo.url);

  const byUrl = new Map<string, { label: string; url: string }>();
  for (const photo of photos) {
    if (!byUrl.has(photo.url)) byUrl.set(photo.url, photo);
  }
  return Array.from(byUrl.values());
}

function hasClientInfo(registration: any) {
  return intakeRows(registration).length > 0 || intakePhotos(registration).length > 0;
}

export default function PaymentsClient({ registrations }: { registrations: any[] }) {
  const router = useRouter();
  const { state, pendingId, run } = useAdminAction();
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [previewUrl, setPreviewUrl] = useState("");
  const [clientInfo, setClientInfo] = useState<any | null>(null);

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
                    {hasClientInfo(reg) && (
                      <button
                        type="button"
                        onClick={() => setClientInfo(reg)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6eae8] bg-white px-3 py-2 text-sm font-semibold text-[#1c2b29] no-underline transition hover:bg-[#f6f8f7]"
                      >
                        <i className="ph ph-user-list text-base" /> Client info
                      </button>
                    )}
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

      {clientInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#10211f]/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Client intake info"
          onClick={() => setClientInfo(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e6eae8] px-4 py-3">
              <div>
                <strong className="block text-sm font-bold text-[#1c2b29]">
                  {clientInfo.name || clientInfo.username || "Client"} info
                </strong>
                <span className="text-xs font-semibold text-[#6b7a77]">
                  {clientInfo.program_name || "Package"} {clientInfo.telegram_id ? `· TG ${clientInfo.telegram_id}` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setClientInfo(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-[#eef2f0] text-[#1c2b29] transition hover:bg-[#e3e9e6]"
                aria-label="Close client info"
              >
                <i className="ph ph-x text-lg" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[#f6f8f7] p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {intakeRows(clientInfo)
                  .filter((row) => row.type !== "photo" && row.key !== "email")
                  .map((row) => (
                    <div key={row.key} className="rounded-2xl border border-[#e6eae8] bg-white p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#9aa8a4]">{row.label}</p>
                      <p className="mt-1 break-words text-sm font-bold text-[#1c2b29]">{String(row.value)}</p>
                    </div>
                  ))}
              </div>

              {intakePhotos(clientInfo).length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-extrabold text-[#1c2b29]">Photos</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {intakePhotos(clientInfo).map((photo, index) => (
                      <button
                        key={`${photo.label}-${index}`}
                        type="button"
                        onClick={() => setPreviewUrl(photo.url)}
                        className="overflow-hidden rounded-2xl border border-[#e6eae8] bg-white p-2 text-left"
                      >
                        <img src={photo.url} alt={photo.label} className="h-44 w-full rounded-xl object-cover" />
                        <span className="mt-2 block text-xs font-bold text-[#1c2b29]">{photo.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {intakeRows(clientInfo).length === 0 && intakePhotos(clientInfo).length === 0 && (
                <p className="rounded-2xl border border-[#e6eae8] bg-white p-5 text-sm font-semibold text-[#6b7a77]">
                  Client info မဖြည့်ရသေးပါ။
                </p>
              )}
            </div>
          </div>
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
