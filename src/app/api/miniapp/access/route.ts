import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  ADMIN_EMAIL,
  ensureAdminAccount,
  ensureTelegramUserAccount,
  isAdminTelegramId,
  normalizeTelegramLoginId,
} from "@/lib/adminAuth";
import { createMiniAppSessionLink } from "@/lib/miniappSession";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

function verifyTelegramInitData(initData: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!token || !initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash") || "";
  params.delete("hash");
  if (!hash) return null;

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = createHmac("sha256", "WebAppData").update(token).digest();
  const calculatedHash = createHmac("sha256", secret).update(dataCheckString).digest("hex");
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(calculatedHash, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const authDate = Number(params.get("auth_date") || "0");
  const maxAgeSeconds = 7 * 24 * 60 * 60;
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > maxAgeSeconds) return null;

  try {
    const user = JSON.parse(params.get("user") || "{}") as {
      id?: number | string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    return {
      id: user.id ? String(user.id) : "",
      username: user.username || "",
      displayName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username || "",
    };
  } catch {
    return null;
  }
}

function verifySignedLaunch(telegramId: string, timestamp: string, signature: string) {
  const cleanTelegramId = normalizeTelegramLoginId(telegramId).replace(/^@/, "");
  const ts = Number(timestamp || "0");
  const secret = process.env.TELEGRAM_BOT_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!cleanTelegramId || !ts || !signature || !secret) return "";

  const maxAgeSeconds = 24 * 60 * 60;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > maxAgeSeconds) return "";

  const calculated = createHmac("sha256", secret)
    .update(`${cleanTelegramId}:${timestamp}`)
    .digest("hex");
  const expected = Buffer.from(signature, "hex");
  const actual = Buffer.from(calculated, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return "";

  return cleanTelegramId;
}

export async function POST(request: Request) {
  try {
    const { telegramId, username, displayName, initData, launchSig, launchTs } = await request.json();
    const verifiedTelegramUser = verifyTelegramInitData(String(initData || ""));
    const signedTelegramId = verifySignedLaunch(
      String(telegramId || ""),
      String(launchTs || ""),
      String(launchSig || ""),
    );
    const allowLocalFallback = process.env.NODE_ENV !== "production";
    const effectiveTelegramId = verifiedTelegramUser?.id || signedTelegramId || (allowLocalFallback ? telegramId : "");
    const cleanTelegramId = normalizeTelegramLoginId(String(effectiveTelegramId || "")).replace(/^@/, "");

    if (!cleanTelegramId) {
      return NextResponse.json(
        { error: "Open Project Peak from the Telegram bot Mini App button." },
        { status: 401 },
      );
    }

    if (verifiedTelegramUser?.id && telegramId && String(telegramId) !== verifiedTelegramUser.id) {
      return NextResponse.json({ error: "Telegram session mismatch." }, { status: 403 });
    }

    const origin = new URL(request.url).origin;
    const supabase = createAdminClient();

    if (isAdminTelegramId(cleanTelegramId)) {
      await ensureAdminAccount(cleanTelegramId);
      const actionLink = createMiniAppSessionLink(origin, {
        email: ADMIN_EMAIL,
        telegramId: cleanTelegramId,
        next: "/admin/dashboard",
      });
      return NextResponse.json({
        status: "admin",
        actionLink,
        message: "Admin access ready.",
      });
    }

    const { data: registration, error: registrationError } = await supabase
      .from("program_registrations")
      .select("id, user_id, email, telegram_id, status, payment_status, program_name")
      .eq("telegram_id", cleanTelegramId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (registrationError) throw registrationError;

    if (!registration) {
      await ensureTelegramUserAccount({
        telegramId: cleanTelegramId,
        username: verifiedTelegramUser?.username || username || "",
        firstName: verifiedTelegramUser?.displayName || displayName || "",
      }).catch(() => null);

      return NextResponse.json({
        status: "none",
        message: "No package found for this Telegram ID.",
      });
    }

    const status = String(registration.status || "pending").toLowerCase();
    const paymentStatus = String(registration.payment_status || status).toLowerCase();
    const effectiveStatus = paymentStatus === "awaiting_payment" ? "awaiting_payment" : status;
    const isReady = status === "ready" || paymentStatus === "ready";

    if (!isReady) {
      return NextResponse.json({
        status: effectiveStatus,
        paymentStatus,
        programName: registration.program_name || "",
      });
    }

    let email = registration.email || "";
    if (!email && registration.user_id) {
      const { data } = await supabase.auth.admin.getUserById(registration.user_id);
      email = data.user?.email || "";
    }

    if (!email) {
      return NextResponse.json(
        { status: "error", error: "Ready account has no login email yet. Please contact admin." },
        { status: 409 },
      );
    }

    const actionLink = createMiniAppSessionLink(origin, {
      email,
      telegramId: cleanTelegramId,
      next: "/user/dashboard",
    });
    return NextResponse.json({
      status: "ready",
      actionLink,
      programName: registration.program_name || "",
      paymentStatus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Mini App access check failed.";
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}
