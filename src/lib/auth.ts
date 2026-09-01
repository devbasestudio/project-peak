import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";

export async function getViewer() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase.from("profiles").select("id, display_name, avatar_url, preferred_locale").eq("id", user.id).maybeSingle();

  return { user, profile };
}

export async function requireViewer(locale: Locale, nextPath = `/${locale}/app`) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/${locale}/login?next=${encodeURIComponent(nextPath)}`);
  return viewer;
}
