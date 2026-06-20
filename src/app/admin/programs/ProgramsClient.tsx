"use client";

import { useMemo, useState } from "react";
import {
  formatMmk,
  projectPrograms,
  type FeedbackFormType,
  type IntakeField,
  type ProjectProgram,
} from "@/lib/projectPeakConfig";
import { Card, FieldLabel, PageHeader, inputClass } from "@/components/admin/ui";
import { Toast, actionButtonClass, useAdminAction } from "@/components/admin/useAdminAction";

export default function ProgramsClient({ programs = projectPrograms }: { programs?: ProjectProgram[] }) {
  const { state, pendingId, run } = useAdminAction();
  const [selected, setSelected] = useState(programs[0]?.key || projectPrograms[0].key);
  const config = useMemo(
    () => programs.find((p) => p.key === selected) || programs[0] || projectPrograms[0],
    [programs, selected],
  );

  // Local editable copies keyed by program so edits persist while switching tabs.
  const [names, setNames] = useState<Record<string, string>>(
    Object.fromEntries(programs.map((p) => [p.key, p.name])),
  );
  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    Object.fromEntries(programs.map((p) => [p.key, p.description])),
  );
  const [intakeFields, setIntakeFields] = useState<Record<string, IntakeField[]>>(
    Object.fromEntries(programs.map((p) => [p.key, p.intakeFields])),
  );
  const [feedbackTypes, setFeedbackTypes] = useState<Record<string, FeedbackFormType>>(
    Object.fromEntries(programs.map((p) => [p.key, p.feedbackFormType || "weekly"])),
  );

  const saving = pendingId === "program";
  const selectedFields = intakeFields[config.key] || [];

  function updateField(fieldId: string, patch: Partial<IntakeField>) {
    setIntakeFields((prev) => ({
      ...prev,
      [config.key]: selectedFields.map((field) =>
        field.id === fieldId ? { ...field, ...patch } : field,
      ),
    }));
  }

  function addTextField() {
    const id = `extra_${Date.now()}`;
    setIntakeFields((prev) => ({
      ...prev,
      [config.key]: [
        ...selectedFields,
        {
          id,
          label: "New question",
          type: "text",
          required: false,
          prompt: "မေးချင်တဲ့ question ကိုရေးပါ။",
        },
      ],
    }));
  }

  function removeField(fieldId: string) {
    setIntakeFields((prev) => ({
      ...prev,
      [config.key]: selectedFields.filter((field) => field.id !== fieldId),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="ph-package"
        title="Programs"
        subtitle="Edit the package catalog clients choose from inside the Telegram bot — names, descriptions and pricing."
      />

      <div className="inline-flex flex-wrap gap-2">
        {programs.map((program) => (
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
                    intakeFields: selectedFields,
                    feedbackFormType: feedbackTypes[config.key] || "weekly",
                  }),
                }),
              )
            }
          >
            <i className="ph ph-floppy-disk text-base" />
            {saving ? "Saving…" : "Save program"}
          </button>

          <div className="flex flex-wrap gap-2">
            <PreviewLink href="/miniapp" icon="ph-lock-key" label="Mini App gate" />
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-[#1c2b29]">Intake questions</h2>
            <p className="mt-1 text-sm text-[#6b7a77]">
              Payment screenshot တင်ပြီးနောက် Telegram bot က user ကိုမေးမယ့် data fields.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-[#e6eae8] bg-white p-1">
            {(["weekly", "end_of_program"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setFeedbackTypes((prev) => ({ ...prev, [config.key]: type }))
                }
                className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                  feedbackTypes[config.key] === type ? "bg-[#1c2b29] text-white" : "text-[#6b7a77]"
                }`}
              >
                {type === "weekly" ? "Weekly feedback" : "End feedback"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {selectedFields.map((field) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-2 rounded-2xl border border-[#e6eae8] bg-[#f6f8f7] p-3 sm:grid-cols-[1.3fr_0.8fr_auto_auto]"
            >
              <FieldLabel>
                Label
                <input
                  className={inputClass}
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value, prompt: e.target.value })}
                />
              </FieldLabel>
              <FieldLabel>
                Type
                <select
                  className={inputClass}
                  value={field.type}
                  onChange={(e) =>
                    updateField(field.id, { type: e.target.value as IntakeField["type"] })
                  }
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="photo">Photo upload</option>
                </select>
              </FieldLabel>
              <label className="flex items-center gap-2 self-end rounded-xl border border-[#e0e7e4] bg-white px-3 py-2.5 text-sm font-bold text-[#1c2b29]">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  className="h-4 w-4 accent-[#1c2b29]"
                />
                Required
              </label>
              <button
                type="button"
                onClick={() => removeField(field.id)}
                className="self-end rounded-xl border border-[#f4c7bd] bg-white px-3 py-2.5 text-sm font-bold text-[#c0432b]"
              >
                <i className="ph ph-trash text-base" />
              </button>
              <FieldLabel>
                Bot prompt
                <input
                  className={inputClass}
                  value={field.prompt || field.label}
                  onChange={(e) => updateField(field.id, { prompt: e.target.value })}
                />
              </FieldLabel>
              <FieldLabel>
                Unit / slot
                <input
                  className={inputClass}
                  value={field.type === "photo" ? field.photoSlot || "" : field.unit || ""}
                  placeholder={field.type === "photo" ? "front / back / side" : "kg, years..."}
                  onChange={(e) =>
                    updateField(
                      field.id,
                      field.type === "photo"
                        ? { photoSlot: e.target.value as IntakeField["photoSlot"] }
                        : { unit: e.target.value },
                    )
                  }
                />
              </FieldLabel>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addTextField}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#cdd6d2] bg-white px-4 py-3 text-sm font-bold text-[#1c2b29] transition hover:bg-[#f6f8f7]"
        >
          <i className="ph ph-plus text-base" />
          Add text field
        </button>
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
