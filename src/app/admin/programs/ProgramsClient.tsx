"use client";

import { useMemo, useState } from "react";
import { formatMmk, projectPrograms } from "@/lib/projectPeakConfig";
import { Card, FieldLabel, PageHeader, inputClass } from "@/components/admin/ui";
import { Toast, actionButtonClass, useAdminAction } from "@/components/admin/useAdminAction";

export default function ProgramsClient() {
  const { state, pendingId, run } = useAdminAction();
  const [selected, setSelected] = useState(projectPrograms[0].key);
  const config = useMemo(
    () => projectPrograms.find((p) => p.key === selected) || projectPrograms[0],
    [selected],
  );

  // Local editable copies keyed by program so edits persist while switching tabs.
  const [names, setNames] = useState<Record<string, string>>(
    Object.fromEntries(projectPrograms.map((p) => [p.key, p.name])),
  );
  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    Object.fromEntries(projectPrograms.map((p) => [p.key, p.description])),
  );

  const saving = pendingId === "program";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="ph-package"
        title="Programs"
        subtitle="Edit the package catalog clients see in the mini app — names, descriptions and pricing."
      />

      <div className="inline-flex flex-wrap gap-2">
        {projectPrograms.map((program) => (
          <button
            key={program.key}
            type="button"
            onClick={() => setSelected(program.key)}
            className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
              selected === program.key
                ? "border-[#1c2b29] bg-[#1c2b29] text-white"
                : "border-[#e6eae8] bg-white text-[#6b7a77] hover:border-[#cdd6d2]"
            }`}
          >
            {program.shortName}
          </button>
        ))}
      </div>

      <Card className="flex flex-col gap-4">
        <FieldLabel>
          Program name
          <input
            className={inputClass}
            value={names[config.key]}
            onChange={(e) => setNames((prev) => ({ ...prev, [config.key]: e.target.value }))}
          />
        </FieldLabel>
        <FieldLabel>
          Description
          <textarea
            rows={4}
            className={inputClass}
            value={descriptions[config.key]}
            onChange={(e) =>
              setDescriptions((prev) => ({ ...prev, [config.key]: e.target.value }))
            }
          />
        </FieldLabel>

        <div>
          <p className="mb-2 text-sm font-semibold text-[#3a4744]">Pricing tiers</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {config.durations.map((duration) => (
              <div
                key={duration.months}
                className="rounded-xl border border-[#e6eae8] bg-[#f6f8f7] p-3"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-[#9aa8a4]">
                  {duration.label}
                </span>
                <strong className="mt-1 block text-base font-extrabold text-[#1c2b29]">
                  {formatMmk(duration.price)}
                </strong>
                <em className="text-xs not-italic text-[#6b7a77]">{duration.note}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            className={actionButtonClass}
            onClick={() =>
              run("program", "Program catalog saved", () =>
                fetch("/api/admin/save-program-template", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...config,
                    name: names[config.key],
                    description: descriptions[config.key],
                  }),
                }),
              )
            }
          >
            <i className="ph ph-floppy-disk text-base" />
            {saving ? "Saving…" : "Save program"}
          </button>

          <div className="flex flex-wrap gap-2">
            <PreviewLink href="/miniapp" icon="ph-stack" label="Choose page" />
            <PreviewLink
              href={`/miniapp/packages/${config.key}`}
              icon="ph-eye"
              label="Details"
            />
            <PreviewLink
              href={`/miniapp/checkout/${config.key}?months=${
                config.durations[1]?.months || config.durations[0].months
              }`}
              icon="ph-credit-card"
              label="Checkout"
            />
          </div>
        </div>
      </Card>

      <Toast state={state} />
    </div>
  );
}

function PreviewLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6eae8] bg-white px-3 py-2 text-sm font-semibold text-[#1c2b29] no-underline transition hover:bg-[#f6f8f7]"
    >
      <i className={`ph ${icon} text-base`} /> {label}
    </a>
  );
}
