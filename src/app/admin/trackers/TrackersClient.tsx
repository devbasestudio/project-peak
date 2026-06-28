"use client";

import { useEffect, useState } from "react";
import { defaultTrackerTemplate, type TrackerField, type TrackerSection } from "@/lib/projectPeakConfig";
import { Card, EmptyState, FieldLabel, PageHeader, inputClass } from "@/components/admin/ui";
import {
  Toast,
  actionButtonClass,
  actionButtonLightClass,
  useAdminAction,
} from "@/components/admin/useAdminAction";

type ClientOption = { id: string; label: string };
type SavedTrackerTemplate = { name: string; sections: unknown };
type TrackerFieldType = TrackerField["type"];

const fieldTypes: TrackerFieldType[] = ["number", "time", "select", "checkbox", "counter", "text", "photo"];
const defaultIconByType: Record<TrackerFieldType, string> = {
  checkbox: "ph-check-square",
  counter: "ph-plus-circle",
  number: "ph-hash",
  photo: "ph-camera",
  select: "ph-list-checks",
  text: "ph-note-pencil",
  time: "ph-clock",
};
const typeOptions: Array<{ type: TrackerFieldType; icon: string; label: string }> = [
  { type: "checkbox", icon: "ph-check-square", label: "Done" },
  { type: "photo", icon: "ph-camera", label: "Photo" },
  { type: "number", icon: "ph-hash", label: "Number" },
  { type: "counter", icon: "ph-plus-circle", label: "Counter" },
  { type: "time", icon: "ph-clock", label: "Time" },
  { type: "select", icon: "ph-list-checks", label: "Choice" },
  { type: "text", icon: "ph-note-pencil", label: "Text" },
];
const iconOptions = [
  { label: "Check", value: "ph-check-square" },
  { label: "Target", value: "ph-target" },
  { label: "Note", value: "ph-note-pencil" },
  { label: "Camera", value: "ph-camera" },
  { label: "Meal", value: "ph-fork-knife" },
  { label: "Workout", value: "ph-barbell" },
  { label: "Water", value: "ph-drop" },
  { label: "Sleep", value: "ph-moon" },
  { label: "Time", value: "ph-clock" },
  { label: "Steps", value: "ph-person-simple-walk" },
  { label: "Win", value: "ph-trend-up" },
  { label: "Warning", value: "ph-warning-circle" },
];

function cloneSections(sections: TrackerSection[]) {
  return JSON.parse(JSON.stringify(sections)) as TrackerSection[];
}

function isTrackerFieldType(value: string): value is TrackerFieldType {
  return fieldTypes.includes(value as TrackerFieldType);
}

function normalizeSections(value: unknown) {
  if (!Array.isArray(value)) return cloneSections(defaultTrackerTemplate);

  const sections = value
    .map((section) => {
      if (!section || typeof section !== "object") return null;
      const raw = section as Record<string, unknown>;
      const matchingDefault = defaultTrackerTemplate.find((item) => item.title === raw.title);
      const title = matchingDefault?.title;
      if (!title) return null;

      const fields = Array.isArray(raw.fields) ? raw.fields : [];
      return {
        title,
        icon: String(raw.icon || matchingDefault.icon || "ph-list-checks"),
        fields: fields
          .map((field) => {
            if (!field || typeof field !== "object") return null;
            const item = field as Record<string, unknown>;
            const label = String(item.label || "").trim();
            const rawIcon = String(item.icon || "").trim();
            const type = rawIcon === "ph-camera" && String(item.type || "") === "checkbox" ? "photo" : String(item.type || "text");
            if (!label || !isTrackerFieldType(type)) return null;

            return {
              id: String(item.id || `field_${crypto.randomUUID()}`).trim(),
              label,
              type,
              icon: rawIcon || defaultIconByType[type],
              fixed: Boolean(item.fixed),
              options:
                type === "select" && Array.isArray(item.options)
                  ? item.options.map((option) => String(option).trim()).filter(Boolean)
                  : undefined,
            } satisfies TrackerField;
          })
          .filter(Boolean) as TrackerField[],
      } satisfies TrackerSection;
    })
    .filter(Boolean) as TrackerSection[];

  return sections.length > 0 ? sections : cloneSections(defaultTrackerTemplate);
}

function freshField(): TrackerField {
  return {
    id: `custom_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    label: "New field",
    type: "text",
    icon: defaultIconByType.text,
  };
}

export default function TrackersClient({
  clientOptions,
  templatesByUserId,
}: {
  clientOptions: ClientOption[];
  templatesByUserId: Record<string, SavedTrackerTemplate>;
}) {
  const { state, pendingId, run } = useAdminAction();
  const [clientId, setClientId] = useState(clientOptions[0]?.id || "");
  const [name, setName] = useState(templatesByUserId[clientOptions[0]?.id || ""]?.name || "Default compact full");
  const [sections, setSections] = useState<TrackerSection[]>(
    normalizeSections(templatesByUserId[clientOptions[0]?.id || ""]?.sections),
  );

  const savingTracker = pendingId === "tracker";
  const sendingReady = pendingId === "ready";
  const hasClient = Boolean(clientId);

  useEffect(() => {
    const savedTemplate = templatesByUserId[clientId];
    setName(savedTemplate?.name || "Default compact full");
    setSections(normalizeSections(savedTemplate?.sections));
  }, [clientId, templatesByUserId]);

  function addField(sectionIndex: number) {
    setSections((current) =>
      current.map((section, index) =>
        index === sectionIndex ? { ...section, fields: [...section.fields, freshField()] } : section,
      ),
    );
  }

  function updateField(sectionIndex: number, fieldIndex: number, updates: Partial<TrackerField>) {
    setSections((current) =>
      current.map((section, index) => {
        if (index !== sectionIndex) return section;
        return {
          ...section,
          fields: section.fields.map((field, itemIndex) => {
            if (itemIndex !== fieldIndex) return field;
            const next = { ...field, ...updates };
            if (next.type !== "select") {
              delete next.options;
            } else if (!next.options || next.options.length === 0) {
              next.options = ["Poor", "OK", "Great"];
            }
            return next;
          }),
        };
      }),
    );
  }

  function removeField(sectionIndex: number, fieldIndex: number) {
    setSections((current) =>
      current.map((section, index) =>
        index === sectionIndex
          ? { ...section, fields: section.fields.filter((_, itemIndex) => itemIndex !== fieldIndex) }
          : section,
      ),
    );
  }

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
            {sections.map((section, sectionIndex) => (
              <Card key={section.title} className="flex flex-col gap-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#1c2b29]">
                  <i className={`ph ${section.icon} text-base text-[#ff6b35]`} />
                  {section.title}
                </h3>
                <ul className="flex flex-col gap-2">
                  {section.fields.map((field, fieldIndex) => (
                    <li
                      key={field.id}
                      className="flex flex-col gap-2 rounded-lg border border-[#e6eae8] bg-[#f6f8f7] p-3"
                    >
                      <div className="flex items-center gap-2">
                        <i
                          className={`ph ${field.icon || defaultIconByType[field.type]} text-base text-[#5b6a67]`}
                        />
                        <input
                          className={`${inputClass} min-w-0 flex-1 py-2`}
                          value={field.label}
                          onChange={(e) => updateField(sectionIndex, fieldIndex, { label: e.target.value })}
                          aria-label={`${section.title} field label`}
                        />
                        <button
                          type="button"
                          disabled={field.fixed}
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border bg-white transition ${
                            field.fixed
                              ? "cursor-not-allowed border-[#dbe4e0] text-[#9aa8a4]"
                              : "border-[#f0d3cc] text-[#c0432b] hover:bg-[#fdeee9]"
                          }`}
                          onClick={() => removeField(sectionIndex, fieldIndex)}
                          aria-label={field.fixed ? `${field.label} is a protected base field` : `Remove ${field.label}`}
                        >
                          <i className={`ph ${field.fixed ? "ph-lock" : "ph-trash"} text-base`} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="grid grid-cols-7 gap-1 rounded-xl border border-[#d8dedb] bg-white p-2">
                          {typeOptions.map((option) => (
                            <button
                              key={option.type}
                              type="button"
                              disabled={field.fixed}
                              title={option.label}
                              onClick={() =>
                                updateField(sectionIndex, fieldIndex, {
                                  type: option.type,
                                  icon:
                                    option.type === "photo" || field.icon === defaultIconByType[field.type]
                                      ? defaultIconByType[option.type]
                                      : field.icon || defaultIconByType[option.type],
                                })
                              }
                              className={`grid h-9 w-9 place-items-center rounded-lg border transition ${
                                field.type === option.type
                                  ? "border-[#1c2b29] bg-[#1c2b29] text-white"
                                  : field.fixed
                                    ? "cursor-not-allowed border-[#e6eae8] bg-[#eef2f0] text-[#9aa8a4]"
                                    : "border-[#e6eae8] bg-[#f6f8f7] text-[#5b6a67] hover:border-[#9aa8a4]"
                              }`}
                              aria-label={`${field.label} ${option.label} type`}
                            >
                              <i className={`ph ${option.icon} text-lg`} />
                            </button>
                          ))}
                        </div>
                        {!field.fixed && (
                          <div className="grid grid-cols-6 gap-1 rounded-xl border border-[#d8dedb] bg-white p-2">
                            {iconOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                title={option.label}
                                onClick={() =>
                                  updateField(sectionIndex, fieldIndex, {
                                    icon: option.value,
                                    ...(option.value === "ph-camera" ? { type: "photo" as TrackerFieldType } : {}),
                                  })
                                }
                                className={`grid h-9 w-9 place-items-center rounded-lg border transition ${
                                  (field.icon || defaultIconByType[field.type]) === option.value
                                    ? "border-[#1c2b29] bg-[#1c2b29] text-white"
                                    : "border-[#e6eae8] bg-[#f6f8f7] text-[#5b6a67] hover:border-[#9aa8a4]"
                                }`}
                                aria-label={`${field.label} ${option.label} icon`}
                              >
                                <i className={`ph ${option.value} text-lg`} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {field.type === "select" && (
                        <input
                          className={`${inputClass} py-2`}
                          value={(field.options || []).join(", ")}
                          onChange={(e) =>
                            updateField(sectionIndex, fieldIndex, {
                              options: e.target.value
                                .split(",")
                                .map((option) => option.trim())
                                .filter(Boolean),
                            })
                          }
                          aria-label={`${field.label} select options`}
                          placeholder="Poor, OK, Great"
                        />
                      )}
                      {field.fixed && (
                        <em className="text-[0.66rem] not-italic text-[#9aa8a4]">Base field</em>
                      )}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#cdd6d2] py-2 text-sm font-semibold text-[#6b7a77] transition hover:bg-[#f6f8f7]"
                  onClick={() => addField(sectionIndex)}
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
                      sections,
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
