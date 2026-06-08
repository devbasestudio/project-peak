import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { userId, name, sections } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { error: upsertError } = await supabase.from("custom_tracker_templates").upsert(
      {
        user_id: userId,
        name: name || "Custom tracker",
        sections: sections || [],
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    return NextResponse.json({
      success: true,
      persisted: !upsertError,
      note: upsertError ? "Run the v2 Supabase migration to persist custom trackers." : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tracker save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
