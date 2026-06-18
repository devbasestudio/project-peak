import { NextResponse } from "next/server";
import { appBaseUrl, requireAdmin } from "@/lib/adminAuth";
import { notifyClientReady } from "@/lib/telegram";

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { data: registration } = await supabase
      .from("program_registrations")
      .select("id, telegram_id, email")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", userId);

    const registrationUpdate = registration?.id
      ? await supabase
          .from("program_registrations")
          .update({
            status: "approved",
            payment_status: "ready",
            ready_at: new Date().toISOString(),
          })
          .eq("id", registration.id)
      : { error: null };

    const telegram = registration?.telegram_id
      ? await notifyClientReady(registration.telegram_id, appBaseUrl(request)).catch((err) => ({
          ok: false,
          error: err instanceof Error ? err.message : "Telegram failed",
        }))
      : { ok: false, skipped: true };

    return NextResponse.json({
      success: true,
      profileUpdated: !profileError,
      registrationUpdated: !registrationUpdate.error,
      telegram,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ready notification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
