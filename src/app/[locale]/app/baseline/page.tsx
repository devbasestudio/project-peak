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
  if (count) redirect(`/${locale}/app/baseline/result`);
  const [{ data: movements }, { data: exercises }] = await Promise.all([
    supabase.from("program_assessment_movements").select("id,name_mm,name_en,equipment_mm,equipment_en").eq("program_id", program.id).eq("assessment_kind", "baseline").order("position"),
    supabase.from("program_exercises").select("id,name_mm,name_en,video_asset_id").eq("program_id", program.id),
  ]);
  if (!movements?.length) throw new Error("Baseline movements are not configured");
  const exerciseIds = (exercises ?? []).map((exercise) => exercise.id);
  const { data: variants } = exerciseIds.length
    ? await supabase.from("program_exercise_videos").select("program_exercise_id,asset_id,role,position").in("program_exercise_id", exerciseIds).order("position")
    : { data: [] };
  const normalize = (value: string) => value.trim().toLocaleLowerCase();
  const videoByExercise = new Map<string, string>();
  for (const exercise of exercises ?? []) {
    const variant = (variants ?? []).find((item) => item.program_exercise_id === exercise.id && item.role === "primary")
      ?? (variants ?? []).find((item) => item.program_exercise_id === exercise.id);
    const assetId = variant?.asset_id ?? exercise.video_asset_id;
    if (assetId) videoByExercise.set(exercise.id, `/api/member-media/${assetId}`);
  }
  const enriched = movements.map((movement) => {
    const exercise = (exercises ?? []).find((item) => normalize(item.name_en) === normalize(movement.name_en) || normalize(item.name_mm) === normalize(movement.name_mm));
    return { ...movement, videoUrl: exercise ? videoByExercise.get(exercise.id) ?? null : null };
  });
  return <><FixedGuideScreen locale={locale} variant="baseline" /><BaselineFlow locale={locale} programId={program.id} movements={enriched} /></>;
}
