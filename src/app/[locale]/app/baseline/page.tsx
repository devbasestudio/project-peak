import { notFound, redirect } from "next/navigation";
import { BaselineFlow } from "@/components/app-shell/baseline-flow";
import { FixedGuideScreen } from "@/components/app-shell/fixed-guide-screen";
import { isLocale } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BaselinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app/baseline`);
  const supabase = await createClient();
  const { data: program } = await supabase.from("programs").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!program) redirect(`/${locale}/app`);
  const { count } = await supabase.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("program_id", program.id).eq("kind", "baseline").eq("status", "completed");
  if (count) redirect(`/${locale}/app`);
  const { data: movements } = await supabase.from("program_assessment_movements").select("id,name_mm,name_en,equipment_mm,equipment_en").eq("program_id", program.id).eq("assessment_kind", "baseline").order("position");
  if (!movements?.length) throw new Error("Baseline movements are not configured");
  return <><FixedGuideScreen locale={locale} variant="baseline" /><BaselineFlow locale={locale} programId={program.id} movements={movements} /></>;
}
