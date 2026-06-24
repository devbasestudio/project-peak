"use client";

import { useMemo, useState } from "react";
import {
  defaultIntakeFields,
  formatMmk,
  type FeedbackFormType,
  type IntakeField,
  type ProgramDuration,
  type ProjectProgram,
} from "@/lib/projectPeakConfig";
import { Card, EmptyState, FieldLabel, PageHeader, inputClass } from "@/components/admin/ui";
import {
  Toast,
  actionButtonClass,
  actionButtonLightClass,
  useAdminAction,
} from "@/components/admin/useAdminAction";

type EditableProgram = ProjectProgram & { isNew?: boolean };

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `program-${Date.now()}`;
}

function newProgram(): EditableProgram {
  return {
    key: `program-${Date.now()}`,
    name: "New program",
    shortName: "New program",
    headline: "",
    description: "",
    bestFor: "",
    image: "/img/hero_bg.jpg",
    accent: "#ff6b35",
    durations: [
      { label: "1 month", months: 1, price: 0, note: "" },
      { label: "3 months", months: 3, price: 0, note: "" },
    ],
    includes: [],
    outcomes: [],
    process: [],
    intakeFields: defaultIntakeFields(),
    feedbackFormType: "weekly",
    isNew: true,
  };
}

function cloneProgram(program: ProjectProgram): EditableProgram {
  return {
    ...program,
    durations: program.durations.map((duration) => ({ ...duration })),
    intakeFields: program.intakeFields.map((field) => ({ ...field })),
  };
}

export default function ProgramsClient({ programs = [] }: { programs?: ProjectProgram[] }) {
  const { state, pendingId, run } = useAdminAction();
  const [items, setItems] = useState<EditableProgram[]>(() => programs.map(cloneProgram));
  const [selected, setSelected] = useState(items[0]?.key || "");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const saving = pendingId === "program";
  const deleting = pendingId === "delete-program";

  const config = useMemo(
    () => items.find((program) => program.key === selected) || null,
    [items, selected],
  );

  function updateProgram(patch: Partial<EditableProgram>) {
    if (!config) return;
    setItems((prev) =>
      prev.map((program) =>
        program.key === config.key
          ? {
              ...program,
              ...patch,
              shortName: patch.name ? patch.name : patch.shortName || program.shortName,
            }
          : program,
      ),
    );
  }

  function createProgram() {
    const program = newProgram();
    setItems((prev) => [...prev, program]);
    setSelected(program.key);
  }

  function updateDuration(index: number, patch: Partial<ProgramDuration>) {
    if (!config) return;
    updateProgram({
      durations: config.durations.map((duration, durationIndex) =>
        durationIndex === index ? { ...duration, ...patch } : duration,
      ),
    });
  }

  function addDuration() {
    if (!config) return;
    const months = Math.max(1, ...config.durations.map((duration) => duration.months || 0)) + 1;
    updateProgram({
      durations: [...config.durations, { label: `${months} months`, months, price: 0, note: "" }],
    });
  }

  function removeDuration(index: number) {
    if (!config) return;
    updateProgram({ durations: config.durations.filter((_, durationIndex) => durationIndex !== index) });
  }

  function updateField(fieldId: string, patch: Partial<IntakeField>) {
    if (!config) return;
    updateProgram({
      intakeFields: config.intakeFields.map((field) =>
        field.id === fieldId ? { ...field, ...patch } : field,
      ),
    });
  }

  function addTextField() {
    if (!config) return;
    const id = `extra_${Date.now()}`;
    updateProgram({
      intakeFields: [
        ...config.intakeFields,
        {
          id,
          label: "New question",
          type: "text",
          required: false,
          prompt: "မေးချင်တဲ့ question ကိုရေးပါ။",
        },
      ],
    });
  }

  function removeField(fieldId: string) {
    if (!config) return;
    updateProgram({ intakeFields: config.intakeFields.filter((field) => field.id !== fieldId) });
  }

  async function uploadProgramImage(file: File | null) {
    if (!file) return;
    setImageUploading(true);
    setImageUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/upload-program-image", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Image upload failed");
      updateProgram({ image: payload.url });
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setImageUploading(false);
    }
  }

  function saveCurrentProgram() {
    if (!config) return;
    const key = config.isNew ? slugify(config.name) : slugify(config.key);
    const payload = {
      ...config,
      key,
      shortName: config.name,
      headline: config.description,
      bestFor: config.description,
      durations: config.durations.filter((duration) => duration.months > 0 && duration.price >= 0),
      intakeFields: config.intakeFields,
      feedbackFormType: config.feedbackFormType,
    };

    run("program", "Program saved", async () => {
      const response = await fetch("/api/admin/save-program-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setItems((prev) =>
          prev.map((program) =>
            program.key === config.key ? { ...payload, isNew: false } : program,
          ),
        );
        setSelected(key);
      }
      return response;
    });
  }

  function deleteCurrentProgram() {
    if (!config || config.isNew) {
      if (config) {
        const nextItems = items.filter((program) => program.key !== config.key);
        setItems(nextItems);
        setSelected(nextItems[0]?.key || "");
      }
      return;
    }

    run("delete-program", "Program deleted", async () => {
      const response = await fetch("/api/admin/delete-program-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: config.key }),
      });
      if (response.ok) {
        const nextItems = items.filter((program) => program.key !== config.key);
        setItems(nextItems);
        setSelected(nextItems[0]?.key || "");
      }
      return response;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon="ph-package"
        title="Programs"
        subtitle="Create the package catalog shown in the Telegram bot. Nothing appears to users until you save it here."
        action={
          <button type="button" className={actionButtonLightClass} onClick={createProgram}>
            <i className="ph ph-plus text-base" />
            New program
          </button>
        }
      />

      {items.length ? (
        <div className="inline-flex flex-wrap gap-2">
          {items.map((program) => (
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
              {program.name || program.key}
            </button>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon="ph-package" text="No programs yet. Create one to show it in the Telegram bot." />
        </Card>
      )}

      {config && (
        <>
          <Card className="flex flex-col gap-4">
            <FieldLabel>
              Program name
              <input
                className={inputClass}
                value={config.name}
                onChange={(event) => updateProgram({ name: event.target.value })}
              />
            </FieldLabel>
            <FieldLabel>
              Description
              <textarea
                rows={4}
                className={inputClass}
                value={config.description}
                onChange={(event) => updateProgram({ description: event.target.value })}
              />
            </FieldLabel>
            <div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-[#3a4744]">Program image</p>
                <div className="flex flex-col gap-3 rounded-2xl border border-[#e6eae8] bg-[#f6f8f7] p-3 sm:flex-row sm:items-center">
                  <div className="h-28 w-full overflow-hidden rounded-xl bg-[#dfe6e3] sm:w-44">
                    <img
                      src={config.image || "/img/hero_bg.jpg"}
                      alt="Program"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <label className={`${actionButtonLightClass} w-fit cursor-pointer`}>
                      <i className="ph ph-upload-simple text-base" />
                      {imageUploading ? "Uploading..." : "Upload image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={imageUploading}
                        onChange={(event) => {
                          void uploadProgramImage(event.target.files?.[0] || null);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <p className="text-xs font-semibold text-[#7a8783]">JPG, PNG, WEBP · max 8MB</p>
                    {imageUploadError && (
                      <p className="rounded-xl border border-[#f4c7bd] bg-[#fdeee9] px-3 py-2 text-xs font-bold text-[#c0432b]">
                        {imageUploadError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#3a4744]">Pricing tiers</p>
                <button type="button" className={actionButtonLightClass} onClick={addDuration}>
                  <i className="ph ph-plus text-base" />
                  Add price
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                {config.durations.map((duration, index) => (
                  <div
                    key={`${duration.months}-${index}`}
                    className="grid grid-cols-1 gap-2 rounded-xl border border-[#e6eae8] bg-[#f6f8f7] p-3 sm:grid-cols-[1fr_0.5fr_0.7fr_auto]"
                  >
                    <FieldLabel>
                      Label
                      <input
                        className={inputClass}
                        value={duration.label}
                        onChange={(event) => updateDuration(index, { label: event.target.value })}
                      />
                    </FieldLabel>
                    <FieldLabel>
                      Months
                      <input
                        className={inputClass}
                        type="number"
                        value={duration.months}
                        onChange={(event) => updateDuration(index, { months: Number(event.target.value) })}
                      />
                    </FieldLabel>
                    <FieldLabel>
                      Price
                      <input
                        className={inputClass}
                        type="number"
                        value={duration.price}
                        onChange={(event) => updateDuration(index, { price: Number(event.target.value) })}
                      />
                    </FieldLabel>
                    <button
                      type="button"
                      onClick={() => removeDuration(index)}
                      className="self-end rounded-xl border border-[#f4c7bd] bg-white px-3 py-2.5 text-sm font-bold text-[#c0432b]"
                    >
                      <i className="ph ph-trash text-base" />
                    </button>
                    <FieldLabel>
                      Note
                      <input
                        className={inputClass}
                        value={duration.note}
                        onChange={(event) => updateDuration(index, { note: event.target.value })}
                      />
                    </FieldLabel>
                    <p className="self-end pb-2 text-sm font-bold text-[#1c2b29]">
                      {formatMmk(Number(duration.price || 0))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={saving}
                className={actionButtonClass}
                onClick={saveCurrentProgram}
              >
                <i className="ph ph-floppy-disk text-base" />
                {saving ? "Saving..." : "Save program"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={deleteCurrentProgram}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#f4c7bd] bg-white px-4 py-2.5 text-sm font-bold text-[#c0432b] transition hover:bg-[#fdeee9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <i className="ph ph-trash text-base" />
                {deleting ? "Deleting..." : config.isNew ? "Discard" : "Delete"}
              </button>
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
                    onClick={() => updateProgram({ feedbackFormType: type as FeedbackFormType })}
                    className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                      config.feedbackFormType === type ? "bg-[#1c2b29] text-white" : "text-[#6b7a77]"
                    }`}
                  >
                    {type === "weekly" ? "Weekly feedback" : "End feedback"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {config.intakeFields.map((field) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 gap-2 rounded-2xl border border-[#e6eae8] bg-[#f6f8f7] p-3 sm:grid-cols-[1.3fr_0.8fr_auto_auto]"
                >
                  <FieldLabel>
                    Label
                    <input
                      className={inputClass}
                      value={field.label}
                      onChange={(event) =>
                        updateField(field.id, { label: event.target.value, prompt: event.target.value })
                      }
                    />
                  </FieldLabel>
                  <FieldLabel>
                    Type
                    <select
                      className={inputClass}
                      value={field.type}
                      onChange={(event) =>
                        updateField(field.id, { type: event.target.value as IntakeField["type"] })
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
                      onChange={(event) => updateField(field.id, { required: event.target.checked })}
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
                      onChange={(event) => updateField(field.id, { prompt: event.target.value })}
                    />
                  </FieldLabel>
                  <FieldLabel>
                    Unit / slot
                    <input
                      className={inputClass}
                      value={field.type === "photo" ? field.photoSlot || "" : field.unit || ""}
                      placeholder={field.type === "photo" ? "front / back / side" : "kg, years..."}
                      onChange={(event) =>
                        updateField(
                          field.id,
                          field.type === "photo"
                            ? { photoSlot: event.target.value as IntakeField["photoSlot"] }
                            : { unit: event.target.value },
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
        </>
      )}

      <Toast state={state} />
    </div>
  );
}
