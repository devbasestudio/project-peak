import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL,
  appBaseUrl,
  ensureAdminAccount,
  isAdminTelegramId,
  normalizeTelegramLoginId,
} from "@/lib/adminAuth";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    const { telegramId } = await request.json();
    const cleanTelegramId = normalizeTelegramLoginId(telegramId);
    if (!cleanTelegramId) {
      return NextResponse.json({ error: "Telegram username / ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // ── Admin Telegram ID check ─────────────────────────────────
    // If the telegram ID matches one of the TELEGRAM_ADMIN_IDS env
    // values, generate a magic link for the admin account directly.
    if (isAdminTelegramId(cleanTelegramId)) {
      await ensureAdminAccount(cleanTelegramId);
      const redirectTo = `${appBaseUrl(request)}/api/auth/callback?next=/admin/dashboard`;
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: ADMIN_EMAIL,
        options: { redirectTo },
      });

      if (linkError || !linkData.properties?.action_link) {
        throw linkError || new Error("Could not create admin login link");
      }

      return NextResponse.json({ success: true, actionLink: linkData.properties.action_link });
    }

    // ── Regular user Telegram login ─────────────────────────────
    const { data: registration, error: registrationError } = await supabase
      .from("program_registrations")
      .select("id, user_id, email, telegram_id, status")
      .eq("telegram_id", cleanTelegramId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (registrationError) {
      return NextResponse.json(
        { error: "Telegram login needs the v2 Supabase migration first." },
        { status: 500 },
      );
    }

    if (!registration) {
      return NextResponse.json({ error: "Telegram username / ID မတွေ့ပါ။ Telegram bot မှာ payment submit ထားတဲ့ username / ID ကိုသုံးပါ။" }, { status: 404 });
    }

    if (String(registration.status || "").toLowerCase() !== "ready") {
      return NextResponse.json({ error: "Admin က custom tracker ပြင်ဆင်နေဆဲပါ။ Ready link ရောက်မှ login ဝင်နိုင်ပါမယ်။" }, { status: 403 });
    }

    let email = registration.email;
    if (!email && registration.user_id) {
      const { data } = await supabase.auth.admin.getUserById(registration.user_id);
      email = data.user?.email || "";
    }

    if (!email) {
      return NextResponse.json({ error: "This Telegram ID does not have an email-linked account yet." }, { status: 400 });
    }

    const redirectTo = `${appBaseUrl(request)}/api/auth/callback?next=/user/dashboard`;
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (linkError || !linkData.properties?.action_link) {
      throw linkError || new Error("Could not create login link");
    }

    return NextResponse.json({ success: true, actionLink: linkData.properties.action_link });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Telegram login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
