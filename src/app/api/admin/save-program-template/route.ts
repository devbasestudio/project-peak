import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { normalizeIntakeFields } from "@/lib/projectPeakConfig";

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const feedbackFormType = body.feedbackFormType === "end_of_program" ? "end_of_program" : "weekly";
    const row = {
      program_key: body.key,
      name: body.name,
      description: body.description,
      image_url: body.image,
      accent: body.accent,
      durations: body.durations || [],
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
    const message = err instanceof Error ? err.message : "Program save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
