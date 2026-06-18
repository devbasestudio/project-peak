import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_EMAIL,
  ensureAdminAccount,
  isAdminTelegramId,
  normalizeTelegramLoginId,
} from "@/lib/adminAuth";
import { verifyMiniAppSessionParams } from "@/lib/miniappSession";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function loginError(request: NextRequest, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
}

async function assertMiniAppAccess(email: string, telegramId: string, next: string) {
  const cleanTelegramId = normalizeTelegramLoginId(telegramId).replace(/^@/, "");

  if (next === "/admin/dashboard") {
    if (email !== ADMIN_EMAIL || !isAdminTelegramId(cleanTelegramId)) {
      throw new Error("Admin Telegram ID is not allowed.");
    }
    await ensureAdminAccount(cleanTelegramId);
    return;
  }

  const supabase = createAdminClient();
  const { data: registration, error } = await supabase
    .from("program_registrations")
    .select("id, email, telegram_id, status, payment_status")
    .eq("telegram_id", cleanTelegramId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!registration) throw new Error("Ready registration not found.");

  const status = String(registration.status || "").toLowerCase();
  const paymentStatus = String(registration.payment_status || "").toLowerCase();
  if (status !== "ready" && paymentStatus !== "ready") {
    throw new Error("Mini App access is not ready yet.");
  }
  if (registration.email && String(registration.email).toLowerCase() !== email) {
    throw new Error("Mini App account mismatch.");
  }
}

export async function GET(request: NextRequest) {
  try {
    const verified = verifyMiniAppSessionParams(request.nextUrl.searchParams);
    if (!verified) return loginError(request, "miniapp_session_invalid");

    await assertMiniAppAccess(verified.email, verified.telegramId, verified.next);

    const admin = createAdminClient();
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: verified.email,
    });

    const tokenHash = linkData?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      throw linkError || new Error("Could not prepare Mini App session.");
    }

    const redirectUrl = new URL(verified.next, request.url);
    let response = NextResponse.redirect(redirectUrl);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });

    if (verifyError) throw verifyError;
    return response;
  } catch (err) {
    console.error("Mini App session failed:", err);
    return loginError(request, "miniapp_session_failed");
  }
}
