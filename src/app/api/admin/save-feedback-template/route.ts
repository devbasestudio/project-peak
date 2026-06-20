import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

const FIELD_TYPES = new Set(["text", "number", "image", "select"]);

function normalizeFields(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const label = String(row.label || "").trim();
      if (!label) return null;

      const type = FIELD_TYPES.has(String(row.type)) ? String(row.type) : "text";
      const field: Record<string, unknown> = {
        id: String(row.id || `field_${index + 1}`),
        label,
        type,
      };

      if (type === "select") {
        const options = Array.isArray(row.options)
          ? row.options.map((option) => String(option).trim()).filter(Boolean)
          : String(row.options || "")
              .split(",")
              .map((option) => option.trim())
              .filter(Boolean);
        field.options = options.length ? options : ["OK", "Needs help"];
      }

      return field;
    })
    .filter(Boolean);
}

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const cadence = String(body.cadence || "weekly").trim().toLowerCase();
    const fields = normalizeFields(body.fields);
    const active = body.active !== false;

    if (!name) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }
    if (!fields.length) {
      return NextResponse.json({ error: "At least one field is required" }, { status: 400 });
    }

    const row = {
      name,
      cadence,
      fields,
      active,
      updated_at: new Date().toISOString(),
    };

    const id = String(body.id || "");
    const numericId = /^\d+$/.test(id) ? Number(id) : null;
    const query = numericId
      ? supabase.from("feedback_form_templates").update(row).eq("id", numericId).select("id, name, cadence, fields, active").single()
      : supabase.from("feedback_form_templates").upsert(row, { onConflict: "name" }).select("id, name, cadence, fields, active").single();

    const { data, error: saveError } = await query;
    if (saveError) throw saveError;

    return NextResponse.json({ success: true, template: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Feedback template save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
