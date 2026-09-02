import { notFound, redirect } from "next/navigation";
import { WorkoutPlayer, type WorkoutItem } from "@/components/app-shell/workout-player";
import { ProgramBlocks, type ProgramBlock } from "@/components/app-shell/program-blocks";
import { isLocale } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProgramWeek } from "@/lib/weekly-schedule";

export const dynamic = "force-dynamic";

type RawItem = Omit<WorkoutItem, "exercise"> & { program_exercises: Omit<WorkoutItem["exercise"], "videos"> | Omit<WorkoutItem["exercise"], "videos">[] };
type RawExerciseVideo = {
  id: string;
  program_exercise_id: string;
  asset_id: string;
  position: number;
  role: "primary" | "alternative";
  title_mm: string;
  title_en: string;
  cue_mm: string | null;
  cue_en: string | null;
};

export default async function WorkoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app/workout`);
  const supabase = await createClient();
  const { data: program } = await supabase.from("programs").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!program) redirect(`/${locale}/app`);

  const [{ count: baselineCount }, { count: completed }] = await Promise.all([
    supabase.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("program_id", program.id).eq("kind", "baseline").eq("status", "completed"),
    supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("program_id", program.id).eq("status", "completed"),
  ]);
  if (!baselineCount) redirect(`/${locale}/app/baseline`);
  if ((completed ?? 0) >= 48) redirect(`/${locale}/app/progress`);
  const dayNumber = (completed ?? 0) + 1;
  const weekNumber = getCurrentProgramWeek(completed ?? 0);
  const { count: scheduledSlots } = await supabase
    .from("weekly_schedule_slots")
    .select("id", { count: "exact", head: true })
    .eq("program_id", program.id)
    .eq("week_number", weekNumber);
  if ((scheduledSlots ?? 0) !== 4) redirect(`/${locale}/app/schedule`);

  const { data: day } = await supabase.from("program_days").select("id,day_number,day_type,phase").eq("program_id", program.id).eq("day_number", dayNumber).single();
  if (!day) throw new Error("The next program day is not configured");
  const { data: rawItems } = await supabase.from("program_day_items").select("id,position,sets,reps_min,reps_max,target_kg,rest_seconds,program_exercises(id,name_mm,name_en,cue_mm,cue_en,equipment_mm,equipment_en,unilateral)").eq("program_day_id", day.id).order("position");
  const exerciseIds = ((rawItems ?? []) as RawItem[]).map((item) => {
    const exercise = Array.isArray(item.program_exercises) ? item.program_exercises[0] : item.program_exercises;
    return exercise?.id;
  }).filter(Boolean) as string[];
  const { data: videoRows } = exerciseIds.length
    ? await supabase.from("program_exercise_videos").select("id,program_exercise_id,asset_id,position,role,title_mm,title_en,cue_mm,cue_en").in("program_exercise_id", exerciseIds).order("position")
    : { data: [] };
  const videos = (videoRows ?? []) as RawExerciseVideo[];
  const assetIds = [...new Set(videos.map((video) => video.asset_id))];
  const { data: assets } = assetIds.length
    ? await supabase.from("media_assets").select("id,bucket_id,object_path").in("id", assetIds)
    : { data: [] };
  const assetById = new Map((assets ?? []).map((asset) => [asset.id, asset]));
  const signedByVideoId = new Map<string, string>();
  await Promise.all(videos.map(async (video) => {
    const asset = assetById.get(video.asset_id);
    if (!asset) return;
    const { data } = await supabase.storage.from(asset.bucket_id).createSignedUrl(asset.object_path, 3600);
    if (data?.signedUrl) signedByVideoId.set(video.id, data.signedUrl);
  }));
  const items: WorkoutItem[] = ((rawItems ?? []) as RawItem[]).map((item) => {
    const rawExercise = Array.isArray(item.program_exercises) ? item.program_exercises[0] : item.program_exercises;
    return {
      ...item,
      exercise: {
        ...rawExercise,
        videos: videos
          .filter((video) => video.program_exercise_id === rawExercise.id && signedByVideoId.has(video.id))
          .map((video) => ({
            id: video.id,
            position: video.position,
            role: video.role,
            title_mm: video.title_mm,
            title_en: video.title_en,
            cue_mm: video.cue_mm,
            cue_en: video.cue_en,
            url: signedByVideoId.get(video.id)!,
          })),
      },
    };
  });
  if (!items.length) throw new Error("No exercises are configured for this session");

  const { data: session } = await supabase.from("workout_sessions").select("id").eq("program_id", program.id).eq("day_number", dayNumber).maybeSingle();
  const { data: logs } = session ? await supabase.from("set_logs").select("program_day_item_id,set_index,weight_kg,reps").eq("session_id", session.id) : { data: [] };

  const { data: document } = await supabase.from("program_documents").select("id").eq("program_id", program.id).eq("day_number", dayNumber).maybeSingle();
  const { data: blocks } = document ? await supabase.from("program_blocks").select("id,block_type,title_mm,title_en,content_mm,content_en,config,visible").eq("document_id", document.id).order("position") : { data: [] };
  return <><ProgramBlocks locale={locale} blocks={(blocks ?? []) as ProgramBlock[]} /><WorkoutPlayer locale={locale} programId={program.id} dayNumber={dayNumber} dayType={day.day_type.toUpperCase()} phase={day.phase} items={items} existingSessionId={session?.id ?? null} initialLogs={logs ?? []} /></>;
}
