import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";

export const getVerifiedUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
    user_metadata: claims.user_metadata ?? {},
  };
});

export const getViewer = cache(async () => {
  const user = await getVerifiedUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("id, display_name, avatar_url, preferred_locale").eq("id", user.id).maybeSingle();

  return { user, profile };
});

export async function requireUser(locale: Locale, nextPath = `/${locale}/app`) {
  const user = await getVerifiedUser();
  if (!user) redirect(`/${locale}/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireViewer(locale: Locale, nextPath = `/${locale}/app`) {
  const viewer = await getViewer();
  if (!viewer) redirect(`/${locale}/login?next=${encodeURIComponent(nextPath)}`);
  return viewer;
}
