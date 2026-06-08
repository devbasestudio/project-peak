import { NextResponse } from "next/server";
import { appBaseUrl, programDefaults, requireAdmin, toProgramType } from "@/lib/adminAuth";
import { notifyAdminsPayment } from "@/lib/telegram";

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { registrationId } = await request.json();
    if (!registrationId) {
      return NextResponse.json({ error: "registrationId is required" }, { status: 400 });
    }

    const { data: registration, error: registrationError } = await supabase
      .from("program_registrations")
      .select("*")
      .eq("id", registrationId)
      .maybeSingle();

    if (registrationError) throw registrationError;
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const programType = toProgramType(registration.program_name);
    const durationMonths = Number(registration.duration_months || 3);
    const durationWeeks = Math.max(4, durationMonths * 4);

    if (registration.user_id) {
      const today = new Date().toISOString().split("T")[0];
      const { error: programError } = await supabase.from("programs").upsert(
        {
          user_id: registration.user_id,
          program_type: programType,
          duration_weeks: durationWeeks,
          start_date: today,
          ...programDefaults(programType),
        },
        { onConflict: "user_id" },
      );
      if (programError) throw programError;
    }

    const updateResult = await supabase
      .from("program_registrations")
      .update({
        status: "approved",
        payment_status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", registrationId);

    const persistedStatus = !updateResult.error;

    try {
      await supabase.from("admin_notifications").insert({
        type: "payment_approved",
        title: "Payment approved",
        body: `${registration.name || "Client"} payment approved. Build custom tracker next.`,
        data: { registrationId, userId: registration.user_id },
        read: false,
      });
    } catch {
      // Optional migration table. Approval should still succeed without it.
    }

    await notifyAdminsPayment(registration, appBaseUrl(request)).catch(() => null);

    return NextResponse.json({ success: true, persistedStatus });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Approval failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
