import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { defaultTrackerTemplate, type TrackerField } from "@/lib/projectPeakConfig";

const TRACKER_FIELD_TYPES = new Set(["number", "time", "select", "checkbox", "counter", "text"]);
const TRACKER_SECTION_TITLES = new Set(["Morning", "Mid-day", "Night"]);
const DEFAULT_ICON_BY_TYPE: Record<string, string> = {
  checkbox: "ph-check-square",
  counter: "ph-plus-circle",
  number: "ph-hash",
  select: "ph-list-checks",
  text: "ph-note-pencil",
  time: "ph-clock",
};

function cleanId(value: unknown, fallback: string) {
  const id = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return id || fallback;
}

function normalizeSections(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((section, sectionIndex) => {
      if (!section || typeof section !== "object") return null;
      const raw = section as Record<string, unknown>;
      const title = String(raw.title || "");
      const fields = Array.isArray(raw.fields) ? raw.fields : [];
      if (!TRACKER_SECTION_TITLES.has(title)) return null;

      const normalizedFields = fields
        .map((field, fieldIndex) => {
          if (!field || typeof field !== "object") return null;
          const item = field as Record<string, unknown>;
          const label = String(item.label || "").trim();
          const type = String(item.type || "text");
          if (!label || !TRACKER_FIELD_TYPES.has(type)) return null;

          return {
            id: cleanId(item.id, `field_${sectionIndex}_${fieldIndex}`),
            label,
            type,
            icon: String(item.icon || DEFAULT_ICON_BY_TYPE[type]).trim() || DEFAULT_ICON_BY_TYPE[type],
            fixed: Boolean(item.fixed),
            ...(type === "select"
              ? {
                  options: Array.isArray(item.options)
                    ? item.options.map((option) => String(option).trim()).filter(Boolean)
                    : [],
                }
              : {}),
          };
        })
        .filter(Boolean) as TrackerField[];

      return {
        title,
        icon: String(raw.icon || "ph-list-checks").trim() || "ph-list-checks",
        fields: protectBaseFields(title, normalizedFields),
      };
    })
    .filter(Boolean);
}

function protectBaseFields(title: string, fields: TrackerField[]) {
  const defaultSection = defaultTrackerTemplate.find((section) => section.title === title);
  const requiredBaseFields = defaultSection?.fields.filter((field) => field.fixed) || [];
  if (!requiredBaseFields.length) return fields;

  const fieldsById = new Map(fields.map((field) => [field.id, field]));
  const protectedBaseFields = requiredBaseFields.map((baseField) => {
    const incoming = fieldsById.get(baseField.id);
    fieldsById.delete(baseField.id);
    return {
      ...baseField,
      label: incoming?.label || baseField.label,
      fixed: true,
    };
  });

  return [...protectedBaseFields, ...Array.from(fieldsById.values())];
}

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { userId, name, sections } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const normalizedSections = normalizeSections(sections);
    if (normalizedSections.length === 0) {
      return NextResponse.json({ error: "At least one tracker section is required" }, { status: 400 });
    }

    const { error: upsertError } = await supabase.from("custom_tracker_templates").upsert(
      {
        user_id: userId,
        name: String(name || "").trim() || "Custom tracker",
        sections: normalizedSections,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      persisted: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tracker save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
