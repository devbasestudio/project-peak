import { notFound, redirect } from "next/navigation";
import { CompletionFlow, type CompletionComparison, type CompletionQuestion, type FinalMovement } from "@/components/app-shell/completion-flow";
import { FixedGuideScreen } from "@/components/app-shell/fixed-guide-screen";
import { requireUser } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CompletionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app/completion`);
  const supabase = await createClient();
  const { data: program } = await supabase
    .from("programs")
    .select("id,name_mm,name_en")
    .eq("user_id", user.id)
    .in("status", ["active", "completed"])
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!program) redirect(`/${locale}/app`);

  const { count: completedSessions } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("program_id", program.id)
    .eq("status", "completed");
  if ((completedSessions ?? 0) < 47) redirect(`/${locale}/app/progress`);

  const { data: savedFinalAttempt } = await supabase
    .from("assessment_attempts")
    .select("id")
    .eq("program_id", program.id)
    .eq("kind", "final")
    .eq("status", "completed")
    .maybeSingle();
  if (!savedFinalAttempt && (completedSessions ?? 0) === 47) {
    const { data: finalSlot } = await supabase
      .from("weekly_schedule_slots")
      .select("scheduled_date")
      .eq("program_id", program.id)
      .eq("day_number", 48)
      .maybeSingle();
    if (!finalSlot?.scheduled_date) redirect(`/${locale}/app/schedule`);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
    if (finalSlot.scheduled_date > today) redirect(`/${locale}/app/rest`);
  }

  const [movementsResult, attemptsResult, questionsResult, quizAttemptResult] = await Promise.all([
    supabase
      .from("program_assessment_movements")
      .select("id,assessment_kind,position,name_mm,name_en,equipment_mm,equipment_en,rest_seconds")
      .eq("program_id", program.id)
      .order("position"),
    supabase
      .from("assessment_attempts")
      .select("id,kind,status")
      .eq("program_id", program.id)
      .eq("status", "completed"),
    supabase
      .from("program_quiz_questions")
      .select("id,position,question_mm,question_en,explanation_mm,explanation_en,program_quiz_options(id,position,text_mm,text_en)")
      .eq("program_id", program.id)
      .order("position"),
    supabase
      .from("quiz_attempts")
      .select("id,status")
      .eq("program_id", program.id)
      .maybeSingle(),
  ]);

  const attempts = attemptsResult.data ?? [];
  const baselineAttempt = attempts.find((attempt) => attempt.kind === "baseline");
  const finalAttempt = attempts.find((attempt) => attempt.kind === "final");
  const attemptIds = attempts.map((attempt) => attempt.id);
  const { data: results } = attemptIds.length
    ? await supabase.from("assessment_results").select("attempt_id,movement_id,value").in("attempt_id", attemptIds)
    : { data: [] };
  const { data: existingAnswers } = quizAttemptResult.data
    ? await supabase.from("quiz_answers").select("question_id,option_id").eq("attempt_id", quizAttemptResult.data.id)
    : { data: [] };

  const movements = movementsResult.data ?? [];
  const baselineValues = new Map((results ?? []).filter((row) => row.attempt_id === baselineAttempt?.id).map((row) => [row.movement_id, Number(row.value)]));
  const finalValues = new Map((results ?? []).filter((row) => row.attempt_id === finalAttempt?.id).map((row) => [row.movement_id, Number(row.value)]));
  const baselineMovements = movements.filter((movement) => movement.assessment_kind === "baseline");
  const finalRows = movements.filter((movement) => movement.assessment_kind === "final");

  const finalMovements: FinalMovement[] = finalRows.map((movement) => {
    const baselineMovement = baselineMovements.find((item) => item.position === movement.position);
    return {
      id: movement.id,
      position: movement.position,
      nameMm: movement.name_mm,
      nameEn: movement.name_en,
      equipmentMm: movement.equipment_mm,
      equipmentEn: movement.equipment_en,
      restSeconds: movement.rest_seconds,
      baseline: baselineMovement ? Number(baselineValues.get(baselineMovement.id) ?? 0) : 0,
      final: finalValues.has(movement.id) ? Number(finalValues.get(movement.id)) : null,
    };
  });

  const comparisons: CompletionComparison[] = finalMovements.map((movement) => ({
    position: movement.position,
    nameMm: movement.nameMm,
    nameEn: movement.nameEn,
    equipmentMm: movement.equipmentMm,
    equipmentEn: movement.equipmentEn,
    baseline: movement.baseline,
    final: movement.final,
  }));

  const questions: CompletionQuestion[] = (questionsResult.data ?? []).map((question) => ({
    id: question.id,
    position: question.position,
    questionMm: question.question_mm,
    questionEn: question.question_en,
    explanationMm: question.explanation_mm,
    explanationEn: question.explanation_en,
    options: [...(question.program_quiz_options ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((option) => ({ id: option.id, position: option.position, textMm: option.text_mm, textEn: option.text_en })),
  }));

  return (
    <><FixedGuideScreen locale={locale} variant="completion" /><CompletionFlow
      locale={locale}
      programId={program.id}
      programName={locale === "mm" ? program.name_mm : program.name_en}
      movements={finalMovements}
      initialComparisons={comparisons}
      questions={questions}
      existingAnswers={(existingAnswers ?? []).map((answer) => ({ questionId: answer.question_id, optionId: answer.option_id }))}
      quizComplete={quizAttemptResult.data?.status === "completed"}
    /></>
  );
}
