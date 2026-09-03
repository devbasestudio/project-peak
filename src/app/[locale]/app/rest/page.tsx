import { notFound, redirect } from "next/navigation";
import { RestDayView } from "@/components/app-shell/rest-day-view";
import { requireUser } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await requireUser(locale, `/${locale}/app/rest`);
  const supabase = await createClient();
  const { data: program } = await supabase.from("programs").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (!program) redirect(`/${locale}/app`);
  const { count: completed } = await supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("program_id", program.id).eq("status", "completed");
  const nextDay = Math.min((completed ?? 0) + 1, 48);
  const [{ data: day }, { data: slot }] = await Promise.all([
    supabase.from("program_days").select("day_number,day_type,title_mm,title_en").eq("program_id", program.id).eq("day_number", nextDay).maybeSingle(),
    supabase.from("weekly_schedule_slots").select("scheduled_date").eq("program_id", program.id).eq("day_number", nextDay).maybeSingle(),
  ]);
  if (!day || !slot?.scheduled_date) redirect(`/${locale}/app/schedule`);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
  if (slot.scheduled_date <= today) redirect(nextDay === 48 ? `/${locale}/app/completion` : `/${locale}/app/workout`);
  return <RestDayView locale={locale} nextDay={nextDay} nextType={day.day_type} nextTitle={(locale === "mm" ? day.title_mm : day.title_en) || day.day_type.toUpperCase()} scheduledDate={slot.scheduled_date} />;
}
