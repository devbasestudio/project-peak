"use client";

import { useMemo, useState } from "react";
import { projectPrograms } from "@/lib/projectPeakConfig";
import { Card, CardTitle, FieldLabel, PageHeader, inputClass } from "@/components/admin/ui";
import {
  Toast,
  actionButtonClass,
  actionButtonLightClass,
  type AdminActionState,
  useAdminAction,
} from "@/components/admin/useAdminAction";

type FeedbackFieldType = "text" | "number" | "image" | "select";

type FeedbackField = {
  id?: string;
  label: string;
  type: FeedbackFieldType;
  options?: string[];
};

type FeedbackTemplate = {
  id?: number | string;
  name: string;
  cadence: string;
  fields: FeedbackField[];
  active: boolean;
};

function normalizeField(field: unknown, index: number): FeedbackField {
  if (typeof field === "string") {
    return { id: `field_${index + 1}`, label: field, type: "text" };
  }

  const row = field && typeof field === "object" ? (field as Record<string, unknown>) : {};
  const type = String(row.type || "text");
  return {
    id: String(row.id || `field_${index + 1}`),
    label: String(row.label || `Field ${index + 1}`),
    type: type === "number" || type === "image" || type === "select" ? type : "text",
    options: Array.isArray(row.options) ? row.options.map(String) : undefined,
  };
}

function normalizeTemplates(value: FeedbackTemplate[]) {
  return value.map((template, index) => ({
    id: template.id || `template_${index + 1}`,
    name: template.name || `Template ${index + 1}`,
    cadence: String(template.cadence || "weekly").toLowerCase(),
    fields: Array.isArray(template.fields)
      ? template.fields.map(normalizeField)
      : [{ id: "field_1", label: "Feedback", type: "text" as const }],
    active: template.active !== false,
  }));
}

function fieldSummary(fields: FeedbackField[]) {
  return fields.map((field) => field.label).filter(Boolean).join(" · ") || "No fields yet";
}

export default function FeedbackClient({ templates: initialTemplates }: { templates: FeedbackTemplate[] }) {
  const { state: broadcastState, pendingId, run } = useAdminAction();
  const [templates, setTemplates] = useState(() => normalizeTemplates(initialTemplates));
  const [selectedId, setSelectedId] = useState(String(templates[0]?.id || ""));
  const [program, setProgram] = useState(projectPrograms[0].name);
  const [templateName, setTemplateName] = useState(templates[0]?.name || "");
  const [saveState, setSaveState] = useState<AdminActionState>(null);
  const [saving, setSaving] = useState(false);

  const selected = useMemo(
    () => templates.find((template) => String(template.id) === selectedId) || templates[0],
    [selectedId, templates],
  );
  const broadcastTemplates = templates.filter((template) => template.active);
  const broadcastOptions = broadcastTemplates.length ? broadcastTemplates : templates;
  const broadcasting = pendingId === "broadcast";

  function updateSelected(patch: Partial<FeedbackTemplate>) {
    if (!selected) return;
    setTemplates((prev) =>
      prev.map((template) =>
        String(template.id) === String(selected.id) ? { ...template, ...patch } : template,
      ),
    );
    if (patch.name && templateName === selected.name) {
      setTemplateName(patch.name);
    }
  }

  function updateField(index: number, patch: Partial<FeedbackField>) {
    if (!selected) return;
    const nextFields = selected.fields.map((field, fieldIndex) =>
      fieldIndex === index ? { ...field, ...patch } : field,
    );
    updateSelected({ fields: nextFields });
  }

  function addField() {
    if (!selected) return;
    updateSelected({
      fields: [
        ...selected.fields,
        {
          id: `field_${Date.now()}`,
          label: "New question",
          type: "text",
        },
      ],
    });
  }

  function removeField(index: number) {
    if (!selected) return;
    updateSelected({ fields: selected.fields.filter((_, fieldIndex) => fieldIndex !== index) });
  }

  function addTemplate() {
    const id = `new_${Date.now()}`;
    const template = {
      id,
      name: "New feedback form",
      cadence: "weekly",
      fields: [{ id: "field_1", label: "Feedback", type: "text" as const }],
      active: true,
    };
    setTemplates((prev) => [...prev, template]);
    setSelectedId(id);
    setTemplateName(template.name);
  }

  async function saveTemplate() {
    if (!selected) return;
    setSaving(true);
    setSaveState({ id: "save-template", label: "Saving...", tone: "info" });
    try {
      const response = await fetch("/api/admin/save-feedback-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Template save failed");

      const saved = normalizeTemplates([payload.template])[0];
      setTemplates((prev) =>
        prev.map((template) =>
          String(template.id) === String(selected.id) ? saved : template,
        ),
      );
      setSelectedId(String(saved.id));
      setTemplateName(saved.name);
      setSaveState({ id: "save-template", label: "Feedback template saved", tone: "success" });
    } catch (error) {
      setSaveState({
        id: "save-template",
        label: error instanceof Error ? error.message : "Template save failed",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="ph-clipboard-text"
        title="Feedback forms"
        subtitle="Edit feedback templates and broadcast a form to clients from the Telegram bot."
        action={
          <button type="button" className={actionButtonLightClass} onClick={addTemplate}>
            <i className="ph ph-plus text-base" />
            New form
          </button>
        }
      />

      <Card>
        <CardTitle icon="ph-list-checks" title="Templates" meta={`${templates.length} forms`} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((tpl) => {
            const active = String(tpl.id) === String(selected?.id);
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  setSelectedId(String(tpl.id));
                  setTemplateName(tpl.name);
                }}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-[#1c2b29] bg-[#eef2f0]"
                    : "border-[#e6eae8] bg-white hover:border-[#cdd6d2]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm font-bold text-[#1c2b29]">{tpl.name}</strong>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.64rem] font-bold ${
                      tpl.active ? "bg-[#edf9f0] text-[#1d7a3a]" : "bg-[#fff4e6] text-[#b25b15]"
                    }`}
                  >
                    {tpl.cadence} · {tpl.active ? "Active" : "Off"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#6b7a77]">
                  {fieldSummary(tpl.fields)}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {selected && (
        <Card className="flex flex-col gap-4">
          <CardTitle icon="ph-pencil-simple-line" title="Template editor" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.2fr_0.7fr_auto]">
            <FieldLabel>
              Name
              <input
                className={inputClass}
                value={selected.name}
                onChange={(event) => updateSelected({ name: event.target.value })}
              />
            </FieldLabel>
            <FieldLabel>
              Cadence
              <select
                className={inputClass}
                value={selected.cadence}
                onChange={(event) => updateSelected({ cadence: event.target.value })}
              >
                <option value="weekly">Weekly</option>
                <option value="end">End of program</option>
                <option value="custom">Custom</option>
              </select>
            </FieldLabel>
            <label className="flex items-end gap-2 rounded-xl border border-[#e6eae8] bg-[#f6f8f7] px-3 py-3 text-sm font-bold text-[#1c2b29]">
              <input
                type="checkbox"
                checked={selected.active}
                onChange={(event) => updateSelected({ active: event.target.checked })}
              />
              Active
            </label>
          </div>

          <div className="flex flex-col gap-3">
            {selected.fields.map((field, index) => (
              <div
                key={`${field.id}-${index}`}
                className="grid grid-cols-1 gap-2 rounded-2xl border border-[#e6eae8] bg-[#f6f8f7] p-3 lg:grid-cols-[1.2fr_0.6fr_1fr_auto]"
              >
                <FieldLabel>
                  Field label
                  <input
                    className={inputClass}
                    value={field.label}
                    onChange={(event) => updateField(index, { label: event.target.value })}
                  />
                </FieldLabel>
                <FieldLabel>
                  Type
                  <select
                    className={inputClass}
                    value={field.type}
                    onChange={(event) =>
                      updateField(index, {
                        type: event.target.value as FeedbackFieldType,
                        options:
                          event.target.value === "select"
                            ? field.options?.length
                              ? field.options
                              : ["OK", "Needs help"]
                            : undefined,
                      })
                    }
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="image">Photo upload</option>
                    <option value="select">Select</option>
                  </select>
                </FieldLabel>
                <FieldLabel>
                  Options
                  <input
                    className={inputClass}
                    disabled={field.type !== "select"}
                    value={(field.options || []).join(", ")}
                    placeholder={field.type === "select" ? "Low, OK, High" : "Only for select fields"}
                    onChange={(event) =>
                      updateField(index, {
                        options: event.target.value
                          .split(",")
                          .map((option) => option.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </FieldLabel>
                <button
                  type="button"
                  className="self-end rounded-xl border border-[#f0c5bd] bg-white px-3 py-3 text-sm font-bold text-[#c0432b] transition hover:bg-[#fdeee9]"
                  onClick={() => removeField(index)}
                >
                  <i className="ph ph-trash text-base" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className={actionButtonLightClass} onClick={addField}>
              <i className="ph ph-plus text-base" />
              Add field
            </button>
            <button type="button" disabled={saving} className={actionButtonClass} onClick={saveTemplate}>
              <i className="ph ph-floppy-disk text-base" />
              {saving ? "Saving..." : "Save template"}
            </button>
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-4">
        <CardTitle icon="ph-paper-plane-tilt" title="Broadcast a form" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldLabel>
            Program
            <select
              className={inputClass}
              value={program}
              onChange={(event) => setProgram(event.target.value)}
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
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
            >
              {broadcastOptions.map((template) => (
                <option key={template.id} value={template.name}>
                  {template.name}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>
        <button
          type="button"
          disabled={broadcasting || !templateName}
          className={`${actionButtonClass} self-start`}
          onClick={() =>
            run("broadcast", "Feedback broadcast queued", () =>
              fetch("/api/admin/broadcast-feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ programName: program, templateName }),
              }),
            )
          }
        >
          <i className="ph ph-paper-plane-tilt text-base" />
          {broadcasting ? "Sending..." : "Broadcast"}
        </button>
      </Card>

      <Toast state={broadcastState || saveState} />
    </div>
  );
}
