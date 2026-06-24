import { NextResponse } from "next/server";
import { appBaseUrl, requireAdmin } from "@/lib/adminAuth";
import { broadcastAdminMessage } from "@/lib/telegram";

function cleanTelegramId(value: unknown) {
  return String(value || "").trim().replace(/^@/, "");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map(cleanTelegramId).filter(Boolean)));
}

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const target = body.target === "package" ? "package" : "all";
    const packageKey = String(body.packageKey || "").trim();
    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json({ error: "Broadcast message ရေးပေးပါ။" }, { status: 400 });
    }
    if (target === "package" && !packageKey) {
      return NextResponse.json({ error: "Package တစ်ခုရွေးပေးပါ။" }, { status: 400 });
    }

    let registrationQuery = supabase
      .from("program_registrations")
      .select("telegram_id, program_key, program_name")
      .not("telegram_id", "is", null);

    if (target === "package") {
      registrationQuery = registrationQuery.eq("program_key", packageKey);
    }

    const { data: registrations, error: registrationError } = await registrationQuery;
    if (registrationError) throw registrationError;

    const registrationTelegramIds = unique((registrations || []).map((item: any) => item.telegram_id));
    let telegramIds = registrationTelegramIds;

    if (target === "all") {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("telegram_id")
        .eq("role", "user")
        .not("telegram_id", "is", null);
      if (profileError) throw profileError;
      telegramIds = unique([...telegramIds, ...(profiles || []).map((item: any) => item.telegram_id)]);
    }

    if (!telegramIds.length) {
      return NextResponse.json({ error: "ပို့စရာ Telegram user မရှိသေးပါ။" }, { status: 404 });
    }

    const telegram = await broadcastAdminMessage(telegramIds, message, appBaseUrl(request));

    try {
      await supabase.from("admin_notifications").insert({
        type: "broadcast_sent",
        title: "Broadcast ပို့ပြီးပါပြီ",
        body: `${telegram.count} ယောက်ဆီ ပို့ထားပါတယ်။`,
        data: { target, packageKey: target === "package" ? packageKey : null, recipients: telegramIds.length },
        read: false,
      });
    } catch {
      // Optional table. Broadcast should keep working without this audit row.
    }

    return NextResponse.json({
      success: true,
      recipients: telegramIds.length,
      telegram,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Broadcast failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
