"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { saveFinalAssessment } from "@/app/customer-actions";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";

export type FinalMovement = {
  id: string;
  position: number;
  nameMm: string;
  nameEn: string;
  equipmentMm: string | null;
  equipmentEn: string | null;
  restSeconds: number;
  baseline: number;
  final: number | null;
};

export type CompletionComparison = Omit<FinalMovement, "id" | "restSeconds">;

export type CompletionQuestion = {
  id: string;
  position: number;
  questionMm: string;
  questionEn: string;
  explanationMm: string | null;
  explanationEn: string | null;
  options: Array<{ id: string; position: number; textMm: string; textEn: string }>;
};

type Feedback = { correct: boolean; correctOptionId: string; explanation: string | null };
type Stage = "retest" | "quiz" | "summary";

export function CompletionFlow({
  locale,
  programId,
  programName,
  movements,
  initialComparisons,
  questions,
  existingAnswers,
  quizComplete,
}: {
  locale: Locale;
  programId: string;
  programName: string;
  movements: FinalMovement[];
  initialComparisons: CompletionComparison[];
  questions: CompletionQuestion[];
  existingAnswers: Array<{ questionId: string; optionId: string }>;
  quizComplete: boolean;
}) {
  const mm = locale === "mm";
  const hasFinal = movements.length > 0 && movements.every((movement) => movement.final != null);
  const initialQuestionIndex = Math.max(0, questions.findIndex((question) => !existingAnswers.some((answer) => answer.questionId === question.id)));
  const [stage, setStage] = useState<Stage>(() => hasFinal ? (quizComplete || questions.length === 0 ? "summary" : "quiz") : "retest");
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(movements.map((movement) => [movement.id, movement.final ?? 0])));
  const [comparisons, setComparisons] = useState(initialComparisons);
  const [saving, setSaving] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(initialQuestionIndex === -1 ? 0 : initialQuestionIndex);
  const [answering, setAnswering] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const question = questions[questionIndex];

  async function saveRetest() {
    if (!movements.length) {
      toast.error(mm ? "Final movements ကို admin က configure လုပ်ဖို့လိုတယ်" : "Final movements need to be configured by the admin.");
      return;
    }
    setSaving(true);
    try {
      const result = await saveFinalAssessment(programId, movements.map((movement) => ({ movementId: movement.id, value: values[movement.id] ?? 0 })), locale);
      if (!result.ok) {
        toast.error(mm ? "Final result သိမ်းမရဘူး" : "Could not save the final results", { description: result.message });
        return;
      }
      setComparisons((current) => current.map((item) => {
        const movement = movements.find((candidate) => candidate.position === item.position);
        return { ...item, final: movement ? values[movement.id] ?? 0 : item.final };
      }));
      setStage(questions.length && !quizComplete ? "quiz" : "summary");
    } finally {
      setSaving(false);
    }
  }

  async function answer(optionId: string) {
    if (!question || feedback || answering) return;
    setAnswering(true);
    setSelectedOptionId(optionId);
    try {
      const supabase = createClient();
      const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
      const { data, error } = await supabase.rpc("answer_quiz_question", {
        p_program_id: programId,
        p_question_id: question.id,
        p_option_id: optionId,
        p_local_date: localDate,
      });
      if (error) throw error;
      const result = data as { correct?: boolean; correct_option_id?: string; explanation_mm?: string | null; explanation_en?: string | null } | null;
      if (!result?.correct_option_id) throw new Error("Quiz feedback is unavailable");
      setFeedback({
        correct: Boolean(result.correct),
        correctOptionId: result.correct_option_id,
        explanation: mm ? result.explanation_mm ?? null : result.explanation_en ?? null,
      });
    } catch (error) {
      setSelectedOptionId(null);
      toast.error(mm ? "Answer သိမ်းမရဘူး" : "Could not save this answer", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setAnswering(false);
    }
  }

  async function nextQuestion() {
    if (!feedback) return;
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((index) => index + 1);
      setSelectedOptionId(null);
      setFeedback(null);
      return;
    }

    setAnswering(true);
    try {
      const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
      const { error } = await createClient().rpc("complete_quiz", { p_program_id: programId, p_local_date: localDate });
      if (error) throw error;
      setStage("summary");
    } catch (error) {
      toast.error(mm ? "Quiz ကို finish မလုပ်နိုင်သေးဘူး" : "Could not finish the quiz", { description: error instanceof Error ? error.message : undefined });
    } finally {
      setAnswering(false);
    }
  }

  if (stage === "summary") return <Summary locale={locale} programName={programName} comparisons={comparisons} />;
  if (stage === "quiz" && question) {
    return (
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between"><p className="eyebrow text-aqua">FINAL CHALLENGE · QUIZ</p><span className="mono text-xs text-charcoal/38">{questionIndex + 1} / {questions.length}</span></header>
        <div className="h-1 overflow-hidden rounded-full bg-charcoal/8"><div className="h-full bg-sky transition-[width]" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
        <section className="surface mt-5 overflow-hidden">
          <header className="bg-charcoal p-6 text-white sm:p-9"><p className="eyebrow text-sky">QUESTION {String(questionIndex + 1).padStart(2, "0")}</p><h1 className="mt-6 font-display text-3xl font-bold leading-tight tracking-[-.045em] sm:text-5xl" lang={mm ? "my" : "en"}>{mm ? question.questionMm : question.questionEn}</h1></header>
          <div className="space-y-3 p-5 sm:p-7">{question.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = feedback?.correctOptionId === option.id;
            const isWrong = Boolean(feedback && isSelected && !feedback.correct);
            return <button key={option.id} type="button" disabled={Boolean(feedback) || answering} onClick={() => answer(option.id)} className={`flex min-h-14 w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition ${isCorrect ? "border-sky bg-ice" : isWrong ? "border-charcoal/20 bg-charcoal/[.035]" : isSelected ? "border-sky" : "border-charcoal/10 bg-white hover:border-sky/50"}`}><span className={`mono grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${isCorrect ? "bg-sky" : "bg-paper"}`}>{String.fromCharCode(65 + index)}</span><span className="flex-1 text-sm font-semibold leading-6" lang={mm ? "my" : "en"}>{mm ? option.textMm : option.textEn}</span>{isCorrect ? <Check size={18} className="text-aqua" /> : isWrong ? <X size={18} className="text-charcoal/45" /> : null}</button>;
          })}</div>
          {feedback ? <div className="mx-5 mb-5 rounded-xl border border-sky/20 bg-ice p-4 sm:mx-7 sm:mb-7"><p className="text-sm font-bold text-aqua">{feedback.correct ? (mm ? "မှန်တယ်" : "Correct") : (mm ? "အဖြေမှန်ကို ပြထားတယ်" : "Here is the right answer")}</p>{feedback.explanation ? <p className="mt-2 text-sm leading-7 text-charcoal/55" lang={mm ? "my" : "en"}>{feedback.explanation}</p> : null}<button type="button" disabled={answering} onClick={nextQuestion} className="primary-button mt-4 w-full">{questionIndex === questions.length - 1 ? (mm ? "Result ကြည့်မယ်" : "See my result") : (mm ? "ဆက်မယ်" : "Continue")}<ArrowRight size={16} /></button></div> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8"><p className="eyebrow text-aqua">WEEK 12 · RETEST</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.055em] sm:text-6xl">{mm ? "ပထမနေ့က ၄ ခုအတိုင်း ပြန်စမ်းမယ်" : "Repeat the four from day one"}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-charcoal/52" lang={mm ? "my" : "en"}>{mm ? "Form တူတူ၊ အခြေအနေတူတူနဲ့ max reps စမ်းပါ။ တစ်ခုပြီးရင် ၃ မိနစ်နားမယ်" : "Use the same form and conditions. Test your max reps, then rest three minutes between movements."}</p></header>
      <section className="surface divide-y divide-charcoal/8 overflow-hidden">{movements.map((movement) => <RetestRow key={movement.id} locale={locale} movement={movement} value={values[movement.id] ?? 0} onChange={(value) => setValues((current) => ({ ...current, [movement.id]: value }))} />)}{movements.length === 0 ? <div className="p-8 text-center text-sm text-charcoal/42">{mm ? "Final movements မထည့်ရသေးဘူး" : "Final movements have not been configured yet."}</div> : null}</section>
      <button type="button" disabled={saving || movements.length === 0} onClick={saveRetest} className="primary-button mt-5 w-full min-h-14 disabled:opacity-45">{saving ? (mm ? "သိမ်းနေတယ်…" : "Saving…") : (mm ? "Week 12 result သိမ်းမယ်" : "Save Week 12 results")}<ArrowRight size={17} /></button>
    </div>
  );
}

function RetestRow({ locale, movement, value, onChange }: { locale: Locale; movement: FinalMovement; value: number; onChange: (value: number) => void }) {
  const mm = locale === "mm";
  return <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7"><div><p className="eyebrow text-aqua">MOVEMENT {String(movement.position).padStart(2, "0")}</p><h2 className="mt-2 font-display text-2xl font-bold">{mm ? movement.nameMm : movement.nameEn}</h2><p className="mt-1 text-xs text-charcoal/38">{mm ? movement.equipmentMm : movement.equipmentEn}</p><p className="mono mt-3 text-xs font-bold text-charcoal/42">WEEK 1 · {movement.baseline}</p></div><div className="flex min-h-14 items-center justify-between gap-5 rounded-xl border border-charcoal/10 bg-paper p-1.5 sm:min-w-64"><button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="grid h-11 w-11 place-items-center rounded-lg bg-white" aria-label="Decrease reps"><Minus size={17} /></button><div className="text-center"><span className="mono text-2xl font-bold">{value}</span><p className="eyebrow text-charcoal/28">REPS</p></div><button type="button" onClick={() => onChange(Math.min(999, value + 1))} className="grid h-11 w-11 place-items-center rounded-lg bg-sky" aria-label="Increase reps"><Plus size={17} /></button></div></div>;
}

function Summary({ locale, programName, comparisons }: { locale: Locale; programName: string; comparisons: CompletionComparison[] }) {
  const mm = locale === "mm";
  const totalGain = useMemo(() => comparisons.reduce((sum, item) => sum + (item.final == null ? 0 : item.final - item.baseline), 0), [comparisons]);
  return <div className="mx-auto max-w-4xl"><section className="relative overflow-hidden rounded-[2rem] bg-charcoal p-6 text-white sm:p-10"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-sky/15" /><Trophy className="relative text-sky" size={32} /><p className="eyebrow relative mt-16 text-sky">{programName} · COMPLETE</p><h1 className="relative mt-4 font-display text-5xl font-bold tracking-[-.065em] sm:text-7xl">Congratulations</h1><p className="relative mt-5 max-w-xl text-base leading-8 text-white/58" lang={mm ? "my" : "en"}>{mm ? "အကြောင်းပြချက်မပေးဘဲ လွယ်အိတ်တစ်လုံးထဲနဲ့ ကြိုးစားတာ 💪" : "You showed up and built this with one backpack and no excuses 💪"}</p><p className="relative mt-3 text-sm text-white/38">Good luck on your next journey</p><div className="relative mt-10 inline-flex items-end gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4"><span className="mono text-4xl font-bold text-sky">{totalGain >= 0 ? "+" : ""}{totalGain}</span><span className="mb-1 text-xs text-white/38">TOTAL REPS</span></div></section><section className="surface mt-4 p-5 sm:p-8"><div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-charcoal/8 pb-3 text-[10px] font-bold uppercase tracking-widest text-charcoal/30"><span>{mm ? "Movement" : "Movement"}</span><span>Week 1</span><span>Week 12</span></div>{comparisons.map((item) => <div key={item.position} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-charcoal/8 py-4 last:border-b-0"><div><p className="font-display font-bold">{mm ? item.nameMm : item.nameEn}</p><p className="mt-1 text-[10px] text-charcoal/35">{mm ? item.equipmentMm : item.equipmentEn}</p></div><span className="mono text-lg font-bold text-charcoal/42">{item.baseline}</span><span className="mono min-w-16 rounded-lg bg-ice px-3 py-2 text-right text-xl font-bold text-aqua">{item.final ?? "—"}</span></div>)}</section><div className="mt-4 grid gap-3 sm:grid-cols-2"><Link href={`/${locale}/app/progress`} className="secondary-button"><ArrowLeft size={16} />{mm ? "တိုးတက်မှုကြည့်မယ်" : "View all progress"}</Link><Link href={`/${locale}`} className="primary-button">{mm ? "Project Peak website" : "Project Peak website"}<ArrowRight size={16} /></Link></div></div>;
}
