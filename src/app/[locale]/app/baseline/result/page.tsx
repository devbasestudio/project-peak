import { notFound, redirect } from "next/navigation";
import { BaselineResultView, type BaselineResult } from "@/components/app-shell/baseline-result-view";
import { requireUser } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BaselineResultPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app/baseline/result`);
  const supabase = await createClient();
  const { data: program } = await supabase.from("programs").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!program) redirect(`/${locale}/app`);
  const [{ data: attempt }, { data: movements }] = await Promise.all([
    supabase.from("assessment_attempts").select("id").eq("program_id", program.id).eq("kind", "baseline").eq("status", "completed").maybeSingle(),
    supabase.from("program_assessment_movements").select("id,position,name_mm,name_en,equipment_mm,equipment_en").eq("program_id", program.id).eq("assessment_kind", "baseline").order("position"),
  ]);
  if (!attempt) redirect(`/${locale}/app/baseline`);
  const { data: values } = await supabase.from("assessment_results").select("movement_id,value").eq("attempt_id", attempt.id);
  const valueByMovement = new Map((values ?? []).map((item) => [item.movement_id, Number(item.value)]));
  const results: BaselineResult[] = (movements ?? []).map((movement) => ({
    position: movement.position,
    nameMm: movement.name_mm,
    nameEn: movement.name_en,
    equipmentMm: movement.equipment_mm,
    equipmentEn: movement.equipment_en,
    value: valueByMovement.get(movement.id) ?? 0,
  }));
  return <BaselineResultView locale={locale} results={results} />;
}
