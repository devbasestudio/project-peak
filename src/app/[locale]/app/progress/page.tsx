import { notFound, redirect } from "next/navigation";
import { ProgressDashboard, type AssessmentComparison, type ExerciseHistory } from "@/components/app-shell/progress-dashboard";
import { requireViewer } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SessionRow = { id: string; day_number: number; session_type: string; local_date: string };
type SetRow = { session_id: string; program_day_item_id: string; set_index: number; weight_kg: number | string; reps: number };

export default async function ProgressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await requireViewer(locale, `/${locale}/app/progress`);
  const supabase = await createClient();
  const { data: program } = await supabase
    .from("programs")
    .select("id,status,name_mm,name_en,assigned_at")
    .eq("user_id", viewer.user.id)
    .in("status", ["active", "completed", "paused"])
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!program) redirect(`/${locale}/app`);

  const [sessionsResult, habitsResult, attemptsResult, movementsResult, setLogsResult] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id,day_number,session_type,local_date")
      .eq("program_id", program.id)
      .eq("status", "completed")
      .order("day_number"),
    supabase
      .from("habit_logs")
      .select("local_date,protein,water,sleep_hours")
      .eq("program_id", program.id)
      .order("local_date"),
    supabase
      .from("assessment_attempts")
      .select("id,kind,local_date,status")
      .eq("program_id", program.id)
      .eq("status", "completed"),
    supabase
      .from("program_assessment_movements")
      .select("id,assessment_kind,position,name_mm,name_en,equipment_mm,equipment_en")
      .eq("program_id", program.id)
      .order("position"),
    supabase
      .from("set_logs")
      .select("session_id,program_day_item_id,set_index,weight_kg,reps")
      .eq("program_id", program.id),
  ]);

  const sessions = (sessionsResult.data ?? []) as SessionRow[];
  const attempts = attemptsResult.data ?? [];
  const movements = movementsResult.data ?? [];
  const setLogs = (setLogsResult.data ?? []) as SetRow[];
  const attemptIds = attempts.map((attempt) => attempt.id);
  const { data: resultRows } = attemptIds.length
    ? await supabase.from("assessment_results").select("attempt_id,movement_id,value").in("attempt_id", attemptIds)
    : { data: [] };

  const baselineAttempt = attempts.find((attempt) => attempt.kind === "baseline");
  const finalAttempt = attempts.find((attempt) => attempt.kind === "final");
  const baselineValues = new Map((resultRows ?? []).filter((row) => row.attempt_id === baselineAttempt?.id).map((row) => [row.movement_id, row.value]));
  const finalValues = new Map((resultRows ?? []).filter((row) => row.attempt_id === finalAttempt?.id).map((row) => [row.movement_id, row.value]));
  const baselineMovements = movements.filter((movement) => movement.assessment_kind === "baseline");
  const finalMovements = movements.filter((movement) => movement.assessment_kind === "final");
  const comparisons: AssessmentComparison[] = baselineMovements.map((movement) => {
    const finalMovement = finalMovements.find((item) => item.position === movement.position);
    return {
      position: movement.position,
      nameMm: movement.name_mm,
      nameEn: movement.name_en,
      equipmentMm: movement.equipment_mm,
      equipmentEn: movement.equipment_en,
      baseline: Number(baselineValues.get(movement.id) ?? 0),
      final: finalMovement && finalValues.has(finalMovement.id) ? Number(finalValues.get(finalMovement.id)) : null,
    };
  });

  const itemIds = [...new Set(setLogs.map((log) => log.program_day_item_id))];
  const { data: dayItems } = itemIds.length
    ? await supabase.from("program_day_items").select("id,program_exercise_id").in("id", itemIds)
    : { data: [] };
  const exerciseIds = [...new Set((dayItems ?? []).map((item) => item.program_exercise_id))];
  const { data: exercises } = exerciseIds.length
    ? await supabase.from("program_exercises").select("id,name_mm,name_en,position").in("id", exerciseIds).order("position")
    : { data: [] };

  const itemExercise = new Map((dayItems ?? []).map((item) => [item.id, item.program_exercise_id]));
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const grouped = new Map<string, Map<string, SetRow[]>>();
  for (const log of setLogs) {
    const exerciseId = itemExercise.get(log.program_day_item_id);
    if (!exerciseId || !sessionMap.has(log.session_id)) continue;
    const bySession = grouped.get(exerciseId) ?? new Map<string, SetRow[]>();
    const rows = bySession.get(log.session_id) ?? [];
    rows.push(log);
    bySession.set(log.session_id, rows);
    grouped.set(exerciseId, bySession);
  }

  const histories: ExerciseHistory[] = (exercises ?? []).map((exercise) => ({
    id: exercise.id,
    nameMm: exercise.name_mm,
    nameEn: exercise.name_en,
    sessions: [...(grouped.get(exercise.id)?.entries() ?? [])]
      .map(([sessionId, logs]) => {
        const session = sessionMap.get(sessionId)!;
        const ordered = [...logs].sort((a, b) => a.set_index - b.set_index);
        return {
          dayNumber: session.day_number,
          dayType: session.session_type,
          weightKg: Number(ordered[0]?.weight_kg ?? 0),
          reps: ordered.map((log) => log.reps),
        };
      })
      .sort((a, b) => a.dayNumber - b.dayNumber),
  }));

  const activityDates = [
    baselineAttempt?.local_date,
    ...sessions.map((session) => session.local_date),
    ...(habitsResult.data ?? []).map((habit) => habit.local_date),
  ].filter((value): value is string => Boolean(value)).sort();

  return (
    <ProgressDashboard
      locale={locale}
      program={{
        name: locale === "mm" ? program.name_mm : program.name_en,
        status: program.status,
        completed: sessions.length,
        startDate: activityDates[0] ?? String(program.assigned_at).slice(0, 10),
      }}
      sessions={sessions.map((session) => ({ dayNumber: session.day_number, dayType: session.session_type, localDate: session.local_date }))}
      habits={(habitsResult.data ?? []).map((habit) => ({
        localDate: habit.local_date,
        protein: habit.protein,
        water: habit.water,
        sleepHours: habit.sleep_hours == null ? null : Number(habit.sleep_hours),
      }))}
      comparisons={comparisons}
      histories={histories}
    />
  );
}
