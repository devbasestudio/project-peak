import { notFound, redirect } from "next/navigation";
import { ProgressDashboard, type AssessmentComparison, type ExerciseHistory } from "@/components/app-shell/progress-dashboard";
import { requireUser } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SessionRow = { id: string; day_number: number; session_type: string; local_date: string };
type ExerciseRow = { id: string; name_mm: string; name_en: string; position: number };
type DayItemRelation = { program_exercise_id: string; program_exercises: ExerciseRow | ExerciseRow[] | null };
type SetRow = {
  session_id: string;
  program_day_item_id: string;
  set_index: number;
  weight_kg: number | string;
  reps: number;
  program_day_items: DayItemRelation | DayItemRelation[] | null;
};
type AssessmentResultRow = { movement_id: string; value: number };
type AttemptRow = {
  id: string;
  kind: string;
  local_date: string;
  status: string;
  assessment_results: AssessmentResultRow[];
};

function firstRelation<T>(relation: T | T[] | null | undefined) {
  return Array.isArray(relation) ? relation[0] : relation ?? undefined;
}

export default async function ProgressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app/progress`);
  const supabase = await createClient();
  const { data: program } = await supabase
    .from("programs")
    .select("id,status,name_mm,name_en,assigned_at")
    .eq("user_id", user.id)
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
      .select("id,kind,local_date,status,assessment_results(movement_id,value)")
      .eq("program_id", program.id)
      .eq("status", "completed"),
    supabase
      .from("program_assessment_movements")
      .select("id,assessment_kind,position,name_mm,name_en,equipment_mm,equipment_en")
      .eq("program_id", program.id)
      .order("position"),
    supabase
      .from("set_logs")
      .select("session_id,program_day_item_id,set_index,weight_kg,reps,program_day_items(program_exercise_id,program_exercises(id,name_mm,name_en,position))")
      .eq("program_id", program.id),
  ]);

  const sessions = (sessionsResult.data ?? []) as SessionRow[];
  const attempts = (attemptsResult.data ?? []) as AttemptRow[];
  const movements = movementsResult.data ?? [];
  const setLogs = (setLogsResult.data ?? []) as unknown as SetRow[];

  const baselineAttempt = attempts.find((attempt) => attempt.kind === "baseline");
  const finalAttempt = attempts.find((attempt) => attempt.kind === "final");
  const baselineValues = new Map((baselineAttempt?.assessment_results ?? []).map((row) => [row.movement_id, row.value]));
  const finalValues = new Map((finalAttempt?.assessment_results ?? []).map((row) => [row.movement_id, row.value]));
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

  const itemExercise = new Map<string, string>();
  const exerciseMap = new Map<string, ExerciseRow>();
  for (const log of setLogs) {
    const dayItem = firstRelation(log.program_day_items);
    const exercise = firstRelation(dayItem?.program_exercises);
    if (!dayItem || !exercise) continue;
    itemExercise.set(log.program_day_item_id, dayItem.program_exercise_id);
    exerciseMap.set(exercise.id, exercise);
  }
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

  const histories: ExerciseHistory[] = [...exerciseMap.values()].sort((a, b) => a.position - b.position).map((exercise) => ({
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
