import { notFound } from "next/navigation";
import { CustomerDashboard } from "@/components/app-shell/customer-dashboard";
import { FixedGuideScreen } from "@/components/app-shell/fixed-guide-screen";
import { isLocale } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProgramWeek, getWeekDayRange, type WeeklyScheduleDay } from "@/lib/weekly-schedule";

export const dynamic = "force-dynamic";

export default async function MemberHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale);
  const supabase = await createClient();

  const [{ data: order }, { data: rawProgram }] = await Promise.all([
    supabase.from("payment_orders").select("reference_code,status,amount_minor,currency").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("programs").select("id,status,name_mm,name_en").eq("user_id", user.id).eq("status", "active").order("assigned_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  let program = null;
  let habits = null;
  let weekSchedule: WeeklyScheduleDay[] = [];
  if (rawProgram) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
    const [{ count }, { count: baselineCount }, { data: habit }] = await Promise.all([
      supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("program_id", rawProgram.id).eq("status", "completed"),
      supabase.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("program_id", rawProgram.id).eq("kind", "baseline").eq("status", "completed"),
      supabase.from("habit_logs").select("protein,water,sleep_hours").eq("program_id", rawProgram.id).eq("local_date", today).maybeSingle(),
    ]);
    program = { ...rawProgram, completed: count ?? 0, hasBaseline: Boolean(baselineCount) };
    habits = habit;
    if (baselineCount && (count ?? 0) < 48) {
      const weekNumber = getCurrentProgramWeek(count ?? 0);
      const { firstDay, lastDay } = getWeekDayRange(weekNumber);
      const [{ data: days }, { data: slots }, { data: completedSessions }] = await Promise.all([
        supabase.from("program_days").select("id,day_number,day_type,title_mm,title_en").eq("program_id", rawProgram.id).gte("day_number", firstDay).lte("day_number", lastDay).order("day_number"),
        supabase.from("weekly_schedule_slots").select("day_number,scheduled_date").eq("program_id", rawProgram.id).eq("week_number", weekNumber).order("session_position"),
        supabase.from("workout_sessions").select("day_number,local_date").eq("program_id", rawProgram.id).eq("status", "completed").gte("day_number", firstDay).lte("day_number", lastDay),
      ]);
      const scheduledByDay = new Map((slots ?? []).map((slot) => [slot.day_number, slot.scheduled_date]));
      const completedByDay = new Map((completedSessions ?? []).map((session) => [session.day_number, session.local_date]));
      weekSchedule = (days ?? []).map((day) => ({
        id: day.id,
        dayNumber: day.day_number,
        dayType: day.day_type,
        titleMm: day.title_mm,
        titleEn: day.title_en,
        scheduledDate: scheduledByDay.get(day.day_number) ?? completedByDay.get(day.day_number) ?? null,
        completed: completedByDay.has(day.day_number),
      }));
    }
  }

  return <CustomerDashboard locale={locale} order={order} program={program} email={user.email ?? ""} habits={habits} weekSchedule={weekSchedule} milestoneGuide={program?.completed === 12 ? <FixedGuideScreen locale={locale} variant="phase2" /> : null} />;
}
