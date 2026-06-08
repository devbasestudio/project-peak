import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const ADMIN_EMAIL = "admin@projectpeak.com";
const ADMIN_USERNAME = "Admin Trainer";

export function normalizeTelegramLoginId(value: string) {
  return String(value || "").trim();
}

export function adminTelegramIds() {
  return (process.env.TELEGRAM_ADMIN_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdminTelegramId(telegramId: string) {
  const cleanTelegramId = normalizeTelegramLoginId(telegramId).replace(/^@/, "");
  return adminTelegramIds().some((id) => id.replace(/^@/, "") === cleanTelegramId);
}

export async function ensureAdminAccount(telegramId?: string) {
  const supabase = createAdminClient();
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    throw listError;
  }

  let user = userList.users.find((item) => item.email?.toLowerCase() === ADMIN_EMAIL);

  if (!user) {
    const password = `ProjectPeakAdmin-${crypto.randomUUID()}`;
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password,
      email_confirm: true,
      user_metadata: {
        username: ADMIN_USERNAME,
        telegram_id: normalizeTelegramLoginId(telegramId || ""),
      },
    });

    if (createError || !created.user) {
      throw createError || new Error("Could not create admin account");
    }
    user = created.user;
  }

  const cleanTelegramId = normalizeTelegramLoginId(telegramId || "");
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username: user.user_metadata?.username || ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        role: "admin",
        onboarding_complete: true,
        ...(cleanTelegramId ? { telegram_id: cleanTelegramId } : {}),
      },
      { onConflict: "id" },
    );

  if (profileError) {
    throw profileError;
  }

  return { user, supabase };
}

export async function requireAdmin() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return { user: null, supabase: createAdminClient(), error: "Unauthorized", status: 401 };
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = user.email === ADMIN_EMAIL ? "admin" : profile?.role || "user";
  if (role !== "admin") {
    return { user, supabase, error: "Forbidden", status: 403 };
  }

  return { user, supabase, error: null, status: 200 };
}

export function toProgramType(programName = "") {
  const lower = programName.toLowerCase();
  if (lower.includes("project") || lower.includes("20")) return "project_20";
  if (lower.includes("mass")) return "mass_method";
  return "skinnyfat_recomp";
}

export function programDefaults(programType: string) {
  if (programType === "project_20") {
    return { target_calories: 1500, macros_p: 140, macros_c: 120, macros_f: 45 };
  }
  if (programType === "mass_method") {
    return { target_calories: 3000, macros_p: 180, macros_c: 350, macros_f: 80 };
  }
  return { target_calories: 1800, macros_p: 150, macros_c: 180, macros_f: 50 };
}

export function appBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}
