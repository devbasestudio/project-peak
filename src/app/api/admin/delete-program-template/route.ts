import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { key } = await request.json();
    const programKey = String(key || "").trim();
    if (!programKey) {
      return NextResponse.json({ error: "Program key is required" }, { status: 400 });
    }

    const { count: registrationCount, error: countError } = await supabase
      .from("program_registrations")
      .select("id", { count: "exact", head: true })
      .eq("program_key", programKey);

    if (countError) throw countError;

    const query = supabase.from("program_catalog");
    const result = registrationCount
      ? await query.update({ active: false, updated_at: new Date().toISOString() }).eq("program_key", programKey)
      : await query.delete().eq("program_key", programKey);

    if (result.error) throw result.error;

    return NextResponse.json({
      success: true,
      archived: Boolean(registrationCount),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Program delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
