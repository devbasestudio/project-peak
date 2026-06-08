"use client";

import { useState } from "react";
import { defaultTrackerTemplate } from "@/lib/projectPeakConfig";
import { Card, EmptyState, FieldLabel, PageHeader, inputClass } from "@/components/admin/ui";
import {
  Toast,
  actionButtonClass,
  actionButtonLightClass,
  useAdminAction,
} from "@/components/admin/useAdminAction";

type ClientOption = { id: string; label: string };

export default function TrackersClient({ clientOptions }: { clientOptions: ClientOption[] }) {
  const { state, pendingId, run } = useAdminAction();
  const [clientId, setClientId] = useState(clientOptions[0]?.id || "");
  const [name, setName] = useState("Default compact full");

  const savingTracker = pendingId === "tracker";
  const sendingReady = pendingId === "ready";
  const hasClient = Boolean(clientId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="ph-layout"
        title="Tracker builder"
        subtitle="Assign a custom daily tracker (Morning · Mid-day · Night) to a client, then send their access link."
      />

      {clientOptions.length === 0 ? (
        <Card>
          <EmptyState icon="ph-users" text="No clients yet. Approve a payment first." />
        </Card>
      ) : (
        <>
          <Card className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldLabel>
              Client
              <select
                className={inputClass}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                {clientOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel>
              Template name
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </FieldLabel>
          </Card>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {defaultTrackerTemplate.map((section) => (
              <Card key={section.title} className="flex flex-col gap-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#1c2b29]">
                  <i className={`ph ${section.icon} text-base text-[#ff6b35]`} />
                  {section.title}
                </h3>
                <ul className="flex flex-col gap-2">
                  {section.fields.map((field) => (
                    <li
                      key={field.id}
                      className="flex items-center gap-2 rounded-lg border border-[#e6eae8] bg-[#f6f8f7] px-3 py-2"
                    >
                      <i className={`ph ${field.icon} text-base text-[#5b6a67]`} />
                      <span className="flex-1 text-sm font-semibold text-[#1c2b29]">
                        {field.label}
                      </span>
                      <em className="text-[0.66rem] not-italic text-[#9aa8a4]">
                        {field.type}
                        {field.fixed ? " · fixed" : ""}
                      </em>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#cdd6d2] py-2 text-sm font-semibold text-[#6b7a77] transition hover:bg-[#f6f8f7]"
                >
                  <i className="ph ph-plus text-base" /> Add field
                </button>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!hasClient || savingTracker}
              className={actionButtonClass}
              onClick={() =>
                run("tracker", "Custom tracker saved", () =>
                  fetch("/api/admin/save-tracker-template", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: clientId,
                      name,
                      sections: defaultTrackerTemplate,
                    }),
                  }),
                )
              }
            >
              <i className="ph ph-floppy-disk text-base" />
              {savingTracker ? "Saving…" : "Save tracker"}
            </button>
            <button
              type="button"
              disabled={!hasClient || sendingReady}
              className={actionButtonLightClass}
              onClick={() =>
                run("ready", "Client access message sent", () =>
                  fetch("/api/admin/send-ready", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: clientId }),
                  }),
                )
              }
            >
              <i className="ph ph-telegram-logo text-base" />
              {sendingReady ? "Sending…" : "Send ready link"}
            </button>
          </div>
        </>
      )}

      <Toast state={state} />
    </div>
  );
}
