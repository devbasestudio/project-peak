"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { saveFinalAssessment } from "@/app/customer-actions";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n";
import { AscentMark, AscentRule } from "@/components/app-shell/ascent-mark";

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
        <header className="mb-5 flex items-center justify-between border-b border-charcoal/15 pb-3"><p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-charcoal/45">SUMMIT CHECK · QUIZ</p><span className="mono text-xs text-charcoal/38">{questionIndex + 1} / {questions.length}</span></header>
        <div className="h-1 bg-charcoal/8"><div className="h-full bg-charcoal transition-[width]" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
        <section className="mt-5 overflow-hidden border border-charcoal/15 bg-white">
          <header className="relative overflow-hidden bg-charcoal p-6 text-white sm:p-9"><AscentMark className="absolute -right-10 top-0 h-40 w-60 text-sky/20" /><p className="relative font-mono text-[10px] font-bold uppercase tracking-[.2em] text-sky">QUESTION {String(questionIndex + 1).padStart(2, "0")}</p><h1 className="relative mt-6 font-display text-3xl font-black uppercase leading-tight tracking-[-.045em] sm:text-5xl" lang={mm ? "my" : "en"}>{mm ? question.questionMm : question.questionEn}</h1></header>
          <div className="space-y-3 p-5 sm:p-7">{question.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrect = feedback?.correctOptionId === option.id;
            const isWrong = Boolean(feedback && isSelected && !feedback.correct);
            return <button key={option.id} type="button" disabled={Boolean(feedback) || answering} onClick={() => answer(option.id)} className={`flex min-h-14 w-full items-center gap-4 border px-4 py-3 text-left transition ${isCorrect ? "border-charcoal bg-sky" : isWrong ? "border-charcoal/30 bg-paper" : isSelected ? "border-charcoal" : "border-charcoal/15 bg-white hover:bg-paper"}`}><span className={`mono grid h-8 w-8 shrink-0 place-items-center border border-charcoal/15 text-xs font-bold ${isCorrect ? "bg-charcoal text-white" : "bg-paper"}`}>{String.fromCharCode(65 + index)}</span><span className="flex-1 text-sm font-semibold leading-6" lang={mm ? "my" : "en"}>{mm ? option.textMm : option.textEn}</span>{isCorrect ? <Check size={18} /> : isWrong ? <X size={18} className="text-charcoal/45" /> : null}</button>;
          })}</div>
          {feedback ? <div className="mx-5 mb-5 border-l-4 border-charcoal bg-sky p-4 sm:mx-7 sm:mb-7"><p className="text-sm font-bold">{feedback.correct ? (mm ? "မှန်တယ်" : "Correct") : (mm ? "အဖြေမှန်ကို ပြထားတယ်" : "Here is the right answer")}</p>{feedback.explanation ? <p className="mt-2 text-sm leading-7 text-charcoal/60" lang={mm ? "my" : "en"}>{feedback.explanation}</p> : null}<button type="button" disabled={answering} onClick={nextQuestion} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 bg-charcoal px-5 text-sm font-bold text-white">{questionIndex === questions.length - 1 ? (mm ? "Result ကြည့်မယ်" : "See my result") : (mm ? "ဆက်မယ်" : "Continue")}<ArrowRight size={16} /></button></div> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="relative mb-10 overflow-hidden border-b-2 border-charcoal pb-8"><AscentMark className="absolute right-0 top-0 h-40 w-64 text-sky" /><p className="relative font-mono text-[10px] font-bold uppercase tracking-[.2em] text-charcoal/45">WEEK 12 · SUMMIT RETEST</p><h1 className="relative mt-4 max-w-3xl font-display text-5xl font-black uppercase leading-[.9] tracking-[-.065em] sm:text-7xl">{mm ? "ပထမနေ့က ၄ ခုအတိုင်း ပြန်စမ်းမယ်" : "Meet your day-one self"}</h1><p className="relative mt-5 max-w-2xl text-sm leading-7 text-charcoal/55" lang={mm ? "my" : "en"}>{mm ? "Form တူတူ၊ အခြေအနေတူတူနဲ့ max reps စမ်းပါ။ တစ်ခုပြီးရင် ၃ မိနစ်နားမယ်" : "Use the same form and conditions. Test your max reps, then rest three minutes between movements."}</p></header>
      <section className="divide-y divide-charcoal/15 overflow-hidden border-y border-charcoal bg-white">{movements.map((movement) => <RetestRow key={movement.id} locale={locale} movement={movement} value={values[movement.id] ?? 0} onChange={(value) => setValues((current) => ({ ...current, [movement.id]: value }))} />)}{movements.length === 0 ? <div className="p-8 text-center text-sm text-charcoal/42">{mm ? "Final movements မထည့်ရသေးဘူး" : "Final movements have not been configured yet."}</div> : null}</section>
      <button type="button" disabled={saving || movements.length === 0} onClick={saveRetest} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 bg-charcoal px-5 text-sm font-bold text-white disabled:opacity-45">{saving ? (mm ? "သိမ်းနေတယ်…" : "Saving…") : (mm ? "Week 12 result သိမ်းမယ်" : "Save Week 12 results")}<ArrowRight size={17} /></button>
    </div>
  );
}

function RetestRow({ locale, movement, value, onChange }: { locale: Locale; movement: FinalMovement; value: number; onChange: (value: number) => void }) {
  const mm = locale === "mm";
  return <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7"><div className="grid grid-cols-[3rem_1fr] gap-4"><span className="font-mono text-3xl font-black text-charcoal/15">{String(movement.position).padStart(2, "0")}</span><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-charcoal/40">MOVEMENT</p><h2 className="mt-2 font-display text-2xl font-black uppercase">{mm ? movement.nameMm : movement.nameEn}</h2><p className="mt-1 text-xs text-charcoal/38">{mm ? movement.equipmentMm : movement.equipmentEn}</p><p className="mono mt-3 text-xs font-bold text-charcoal/42">BASELINE · {movement.baseline}</p></div></div><div className="flex min-h-14 items-center justify-between gap-5 border border-charcoal/15 bg-paper p-1 sm:min-w-64"><button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="grid h-11 w-11 place-items-center border-r border-charcoal/10 bg-white" aria-label="Decrease reps"><Minus size={17} /></button><div className="text-center"><span className="mono text-2xl font-bold">{value}</span><p className="font-mono text-[8px] font-bold uppercase tracking-wider text-charcoal/28">REPS</p></div><button type="button" onClick={() => onChange(Math.min(999, value + 1))} className="grid h-11 w-11 place-items-center bg-sky" aria-label="Increase reps"><Plus size={17} /></button></div></div>;
}

function Summary({ locale, programName, comparisons }: { locale: Locale; programName: string; comparisons: CompletionComparison[] }) {
  const mm = locale === "mm";
  const totalGain = useMemo(() => comparisons.reduce((sum, item) => sum + (item.final == null ? 0 : item.final - item.baseline), 0), [comparisons]);
  return <div className="mx-auto max-w-4xl"><section className="relative overflow-hidden bg-charcoal p-6 text-white sm:p-10"><AscentMark className="absolute -right-10 top-0 h-64 w-96 text-sky/25" /><Trophy className="relative text-sky" size={32} /><p className="relative mt-16 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-sky">{programName} · SUMMIT REACHED</p><h1 className="relative mt-4 font-display text-5xl font-black uppercase leading-[.86] tracking-[-.07em] sm:text-8xl">The work<br />is the proof.</h1><p className="relative mt-6 max-w-xl text-base leading-8 text-white/58" lang={mm ? "my" : "en"}>{mm ? "အကြောင်းပြချက်မပေးဘဲ လွယ်အိတ်တစ်လုံးထဲနဲ့ ကြိုးစားတာ 💪" : "You showed up and built this with one backpack and no excuses 💪"}</p><div className="relative mt-10 flex items-end gap-3 border-l-4 border-sky pl-5"><span className="mono text-5xl font-black text-sky">{totalGain >= 0 ? "+" : ""}{totalGain}</span><span className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/38">TOTAL REPS</span></div><div className="relative mt-10"><AscentRule completed={48} /></div></section><section className="mt-4 border border-charcoal/15 bg-white p-5 sm:p-8"><div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b-2 border-charcoal pb-3 text-[10px] font-bold uppercase tracking-widest text-charcoal/40"><span>Movement</span><span>Base</span><span>Summit</span></div>{comparisons.map((item) => <div key={item.position} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-charcoal/15 py-4 last:border-b-0"><div><p className="font-display font-black uppercase">{mm ? item.nameMm : item.nameEn}</p><p className="mt-1 text-[10px] text-charcoal/35">{mm ? item.equipmentMm : item.equipmentEn}</p></div><span className="mono text-lg font-bold text-charcoal/42">{item.baseline}</span><span className="mono min-w-16 bg-sky px-3 py-2 text-right text-xl font-bold">{item.final ?? "—"}</span></div>)}</section><div className="mt-4 grid gap-3 sm:grid-cols-2"><Link href={`/${locale}/app/progress`} className="flex min-h-12 items-center justify-center gap-2 border border-charcoal/15 bg-white px-5 text-sm font-bold hover:bg-paper"><ArrowLeft size={16} />{mm ? "တိုးတက်မှုကြည့်မယ်" : "View all progress"}</Link><Link href={`/${locale}`} className="flex min-h-12 items-center justify-center gap-2 bg-charcoal px-5 text-sm font-bold text-white">Project Peak website<ArrowRight size={16} /></Link></div></div>;
}
