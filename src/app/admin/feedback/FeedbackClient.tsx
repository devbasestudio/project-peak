"use client";

import { useState } from "react";
import { feedbackTemplates, projectPrograms } from "@/lib/projectPeakConfig";
import { Card, CardTitle, FieldLabel, PageHeader, inputClass } from "@/components/admin/ui";
import { Toast, actionButtonClass, useAdminAction } from "@/components/admin/useAdminAction";

export default function FeedbackClient() {
  const { state, pendingId, run } = useAdminAction();
  const [program, setProgram] = useState(projectPrograms[0].name);
  const [template, setTemplate] = useState(feedbackTemplates[0].name);

  const broadcasting = pendingId === "broadcast";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="ph-clipboard-text"
        title="Feedback forms"
        subtitle="Review feedback templates and broadcast a form to everyone on a program."
      />

      <Card>
        <CardTitle icon="ph-list-checks" title="Templates" meta={`${feedbackTemplates.length} forms`} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {feedbackTemplates.map((tpl) => (
            <div key={tpl.name} className="rounded-xl border border-[#e6eae8] p-4">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm font-bold text-[#1c2b29]">{tpl.name}</strong>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.64rem] font-bold ${
                    tpl.status === "Ready"
                      ? "bg-[#edf9f0] text-[#1d7a3a]"
                      : "bg-[#fff4e6] text-[#b25b15]"
                  }`}
                >
                  {tpl.cadence} · {tpl.status}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#6b7a77]">
                {tpl.fields.join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <CardTitle icon="ph-paper-plane-tilt" title="Broadcast a form" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldLabel>
            Program
            <select
              className={inputClass}
              value={program}
              onChange={(e) => setProgram(e.target.value)}
            >
              {projectPrograms.map((p) => (
                <option key={p.key} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </FieldLabel>
          <FieldLabel>
            Form
            <select
              className={inputClass}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {feedbackTemplates.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>
        <button
          type="button"
          disabled={broadcasting}
          className={`${actionButtonClass} self-start`}
          onClick={() =>
            run("broadcast", "Feedback broadcast queued", () =>
              fetch("/api/admin/broadcast-feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ programName: program, templateName: template }),
              }),
            )
          }
        >
          <i className="ph ph-paper-plane-tilt text-base" />
          {broadcasting ? "Sending…" : "Broadcast"}
        </button>
      </Card>

      <Toast state={state} />
    </div>
  );
}
