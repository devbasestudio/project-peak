import { notFound, redirect } from "next/navigation";
import { HabitEditor } from "@/components/app-shell/habit-editor";
import { requireUser } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HabitsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ date?: string }> }) {
  const { locale } = await params;
  const { date } = await searchParams;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app/habits`);
  const supabase = await createClient();
  const { data: program } = await supabase
    .from("programs")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!program) redirect(`/${locale}/app`);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") && (date as string) <= today ? date as string : today;
  const { data: habit } = await supabase
    .from("habit_logs")
    .select("protein,water,sleep_hours")
    .eq("program_id", program.id)
    .eq("local_date", selectedDate)
    .maybeSingle();

  return (
    <HabitEditor
      locale={locale}
      programId={program.id}
      userId={user.id}
      localDate={selectedDate}
      today={today}
      initialHabit={{
        protein: habit?.protein ?? false,
        water: habit?.water ?? false,
        sleepHours: habit?.sleep_hours == null ? null : Number(habit.sleep_hours),
      }}
    />
  );
}
