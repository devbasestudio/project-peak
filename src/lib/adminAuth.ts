import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

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

  const role = profile?.role || (user.email === "admin@projectpeak.com" ? "admin" : "user");
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
