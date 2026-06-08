import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const row = {
      program_key: body.key,
      name: body.name,
      description: body.description,
      image_url: body.image,
      accent: body.accent,
      durations: body.durations || [],
      intake_fields: body.intakeFields || [],
      active: true,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("program_catalog")
      .upsert(row, { onConflict: "program_key" });

    return NextResponse.json({
      success: true,
      persisted: !upsertError,
      note: upsertError ? "Run the v2 Supabase migration to persist program catalog edits." : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Program save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
