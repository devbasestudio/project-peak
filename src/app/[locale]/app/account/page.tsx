import { notFound } from "next/navigation";
import { AccountPanel } from "@/components/app-shell/account-panel";
import { requireViewer } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await requireViewer(locale, `/${locale}/app/account`);
  const supabase = await createClient();
  const [{ data: program }, { data: order }] = await Promise.all([
    supabase
      .from("programs")
      .select("status,name_mm,name_en,assigned_at")
      .eq("user_id", viewer.user.id)
      .in("status", ["active", "completed", "paused"])
      .order("assigned_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("payment_orders")
      .select("status,reference_code")
      .eq("user_id", viewer.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <AccountPanel
      locale={locale}
      email={viewer.user.email ?? ""}
      displayName={viewer.profile?.display_name ?? viewer.user.user_metadata?.full_name ?? ""}
      preferredLocale={viewer.profile?.preferred_locale === "en" ? "en" : "mm"}
      program={program ? {
        status: program.status,
        name: locale === "mm" ? program.name_mm : program.name_en,
        assignedDate: new Intl.DateTimeFormat(locale === "mm" ? "my-MM" : "en-US", {
          dateStyle: "medium",
          timeZone: "Asia/Yangon",
        }).format(new Date(program.assigned_at)),
      } : null}
      order={order}
    />
  );
}
