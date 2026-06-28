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

    const { data: registration, error: registrationError } = await supabase
      .from("program_registrations")
      .select("id, telegram_id, email, payment_status, ready_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (registrationError) throw registrationError;
    if (!registration) {
      return NextResponse.json({ error: "Registration not found for this client." }, { status: 404 });
    }
    const paymentStatus = String(registration.payment_status || "").toLowerCase();
    if (paymentStatus !== "approved" && paymentStatus !== "ready") {
      return NextResponse.json({ error: "Payment must be approved before sending ready access." }, { status: 409 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", userId);

    if (profileError) throw profileError;

    const registrationUpdate = await supabase
      .from("program_registrations")
      .update({
        status: "approved",
        payment_status: "ready",
        ready_at: registration.ready_at || new Date().toISOString(),
      })
      .eq("id", registration.id);

    if (registrationUpdate.error) throw registrationUpdate.error;

    const telegram = registration.telegram_id
      ? await notifyClientReady(registration.telegram_id, appBaseUrl(request)).catch((err) => ({
          ok: false,
          error: err instanceof Error ? err.message : "Telegram failed",
        }))
      : { ok: false, skipped: true };

    return NextResponse.json({
      success: true,
      profileUpdated: true,
      registrationUpdated: true,
      telegram,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ready notification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
