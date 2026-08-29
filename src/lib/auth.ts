import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";

export async function getViewer() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const [{ data: profile }, { data: admin }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, avatar_url, preferred_locale").eq("id", user.id).maybeSingle(),
    supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  return { user, profile, isAdmin: Boolean(admin) };
}

export async function requireViewer(locale: Locale, nextPath = `/${locale}/app`) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/${locale}/login?next=${encodeURIComponent(nextPath)}`);
  return viewer;
}

export async function requireAdmin(locale: Locale) {
  const viewer = await requireViewer(locale, `/${locale}/admin`);
  if (!viewer.isAdmin) redirect(`/${locale}/app?notice=admin`);
  return viewer;
}
