import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { normalizeIntakeFields } from "@/lib/projectPeakConfig";

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "";
}

function normalizeDurations(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const months = Number(row.months);
      const price = Number(row.price);
      if (!Number.isFinite(months) || months <= 0 || !Number.isFinite(price) || price < 0) return null;
      return {
        label: String(row.label || `${months} month${months > 1 ? "s" : ""}`).trim(),
        months,
        price,
        note: String(row.note || "").trim(),
      };
    })
    .filter(Boolean);
}

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const feedbackFormType = body.feedbackFormType === "end_of_program" ? "end_of_program" : "weekly";
    const name = String(body.name || "").trim();
    const programKey = slugify(String(body.key || name));
    const durations = normalizeDurations(body.durations || []);

    if (!name) {
      return NextResponse.json({ error: "Program name ထည့်ပေးပါ။" }, { status: 400 });
    }
    if (!programKey) {
      return NextResponse.json({ error: "Program name မှာ စာလုံး ဒါမှမဟုတ် နံပါတ် ပါအောင်ရေးပေးပါ။" }, { status: 400 });
    }
    if (!durations.length) {
      return NextResponse.json({ error: "ဈေးနှုန်းတစ်ခုအနည်းဆုံး ထည့်ပေးပါ။" }, { status: 400 });
    }

    const row = {
      program_key: programKey,
      name,
      description: String(body.description || "").trim(),
      image_url: String(body.image || "/img/hero_bg.jpg").trim(),
      accent: String(body.accent || "#ff6b35").trim(),
      durations,
      intake_fields: normalizeIntakeFields(body.intakeFields || []),
      feedback_form_type: feedbackFormType,
      active: true,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("program_catalog")
      .upsert(row, { onConflict: "program_key" });

    if (upsertError) throw upsertError;

    return NextResponse.json({
      success: true,
      persisted: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Program သိမ်းမရသေးပါ။";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
