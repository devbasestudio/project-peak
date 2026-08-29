import { notFound, redirect } from "next/navigation";
import { WorkoutPlayer, type WorkoutItem } from "@/components/app-shell/workout-player";
import { ProgramBlocks, type ProgramBlock } from "@/components/app-shell/program-blocks";
import { isLocale } from "@/lib/i18n";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RawItem = Omit<WorkoutItem, "exercise"> & { program_exercises: WorkoutItem["exercise"] | WorkoutItem["exercise"][] };

export default async function WorkoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await requireViewer(locale, `/${locale}/app/workout`);
  const supabase = await createClient();
  const { data: program } = await supabase.from("programs").select("id").eq("user_id", viewer.user.id).eq("status", "active").limit(1).maybeSingle();
  if (!program) redirect(`/${locale}/app`);

  const [{ count: baselineCount }, { count: completed }] = await Promise.all([
    supabase.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("program_id", program.id).eq("kind", "baseline").eq("status", "completed"),
    supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("program_id", program.id).eq("status", "completed"),
  ]);
  if (!baselineCount) redirect(`/${locale}/app/baseline`);
  if ((completed ?? 0) >= 48) redirect(`/${locale}/app/progress`);
  const dayNumber = (completed ?? 0) + 1;

  const { data: day } = await supabase.from("program_days").select("id,day_number,day_type,phase").eq("program_id", program.id).eq("day_number", dayNumber).single();
  if (!day) throw new Error("The next program day is not configured");
  const { data: rawItems } = await supabase.from("program_day_items").select("id,position,sets,reps_min,reps_max,target_kg,rest_seconds,program_exercises(id,name_mm,name_en,cue_mm,cue_en,unilateral)").eq("program_day_id", day.id).order("position");
  const items: WorkoutItem[] = ((rawItems ?? []) as RawItem[]).map((item) => ({ ...item, exercise: Array.isArray(item.program_exercises) ? item.program_exercises[0] : item.program_exercises }));
  if (!items.length) throw new Error("No exercises are configured for this session");

  const { data: session } = await supabase.from("workout_sessions").select("id").eq("program_id", program.id).eq("day_number", dayNumber).maybeSingle();
  const { data: logs } = session ? await supabase.from("set_logs").select("program_day_item_id,set_index,weight_kg,reps").eq("session_id", session.id) : { data: [] };

  const { data: document } = await supabase.from("program_documents").select("id").eq("program_id", program.id).eq("day_number", dayNumber).maybeSingle();
  const { data: blocks } = document ? await supabase.from("program_blocks").select("id,block_type,title_mm,title_en,content_mm,content_en,config,visible").eq("document_id", document.id).order("position") : { data: [] };
  return <><ProgramBlocks locale={locale} blocks={(blocks ?? []) as ProgramBlock[]} /><WorkoutPlayer locale={locale} programId={program.id} dayNumber={dayNumber} dayType={day.day_type.toUpperCase()} phase={day.phase} items={items} existingSessionId={session?.id ?? null} initialLogs={logs ?? []} /></>;
}
