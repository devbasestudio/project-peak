import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { error: deleteError } = await supabase.from("user_devices").delete().eq("user_id", userId);

    return NextResponse.json({
      success: true,
      persisted: !deleteError,
      note: deleteError ? "Run the v2 Supabase migration to enable device session storage." : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Device reset failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
