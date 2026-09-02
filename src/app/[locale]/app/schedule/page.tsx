import { notFound, redirect } from "next/navigation";
import { WeeklySchedulePlanner } from "@/components/app-shell/weekly-schedule-planner";
import { requireUser } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProgramWeek, getWeekDayRange, type WeeklyScheduleDay } from "@/lib/weekly-schedule";

export const dynamic = "force-dynamic";

export default async function SchedulePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app/schedule`);
  const supabase = await createClient();
  const { data: program } = await supabase.from("programs").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!program) redirect(`/${locale}/app`);

  const [{ count: baselineCount }, { count: completed }] = await Promise.all([
    supabase.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("program_id", program.id).eq("kind", "baseline").eq("status", "completed"),
    supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("program_id", program.id).eq("status", "completed"),
  ]);
  if (!baselineCount) redirect(`/${locale}/app/baseline`);
  if ((completed ?? 0) >= 48) redirect(`/${locale}/app/progress`);

  const weekNumber = getCurrentProgramWeek(completed ?? 0);
  const { firstDay, lastDay } = getWeekDayRange(weekNumber);
  const [{ data: programDays }, { data: slots }, { data: completedSessions }] = await Promise.all([
    supabase.from("program_days").select("id,day_number,day_type,title_mm,title_en").eq("program_id", program.id).gte("day_number", firstDay).lte("day_number", lastDay).order("day_number"),
    supabase.from("weekly_schedule_slots").select("day_number,scheduled_date").eq("program_id", program.id).eq("week_number", weekNumber).order("session_position"),
    supabase.from("workout_sessions").select("day_number,local_date").eq("program_id", program.id).eq("status", "completed").gte("day_number", firstDay).lte("day_number", lastDay),
  ]);
  if ((programDays ?? []).length !== 4) throw new Error("This week is not fully configured");

  const scheduledByDay = new Map((slots ?? []).map((slot) => [slot.day_number, slot.scheduled_date]));
  const completedByDay = new Map((completedSessions ?? []).map((session) => [session.day_number, session.local_date]));
  const days: WeeklyScheduleDay[] = (programDays ?? []).map((day) => ({
    id: day.id,
    dayNumber: day.day_number,
    dayType: day.day_type,
    titleMm: day.title_mm,
    titleEn: day.title_en,
    scheduledDate: scheduledByDay.get(day.day_number) ?? completedByDay.get(day.day_number) ?? null,
    completed: completedByDay.has(day.day_number),
  }));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());

  return <WeeklySchedulePlanner locale={locale} programId={program.id} weekNumber={weekNumber} days={days} today={today} />;
}
