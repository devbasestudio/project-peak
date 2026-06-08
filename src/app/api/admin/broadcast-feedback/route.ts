import { NextResponse } from "next/server";
import { appBaseUrl, requireAdmin } from "@/lib/adminAuth";
import { broadcastFeedbackMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const { programName, templateName } = await request.json();
    if (!programName || !templateName) {
      return NextResponse.json({ error: "programName and templateName are required" }, { status: 400 });
    }

    const { data: registrations, error: registrationError } = await supabase
      .from("program_registrations")
      .select("user_id, telegram_id, program_name")
      .ilike("program_name", `%${programName.split(" ")[0]}%`);

    const telegramIds = registrationError ? [] : (registrations || []).map((item: any) => item.telegram_id).filter(Boolean);

    const { error: requestError } = await supabase.from("feedback_requests").insert({
      program_name: programName,
      template_name: templateName,
      recipient_count: telegramIds.length,
      status: "queued",
      created_at: new Date().toISOString(),
    });

    const telegram = await broadcastFeedbackMessage(telegramIds, templateName, appBaseUrl(request)).catch((err) => ({
      ok: false,
      error: err instanceof Error ? err.message : "Telegram failed",
    }));

    return NextResponse.json({
      success: true,
      recipients: telegramIds.length,
      persisted: !requestError,
      telegram,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Broadcast failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
