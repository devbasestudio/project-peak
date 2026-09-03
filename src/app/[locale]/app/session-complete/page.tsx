import { notFound, redirect } from "next/navigation";
import { SessionCompleteView, type SessionLearningAsset } from "@/components/app-shell/session-complete-view";
import { requireUser } from "@/lib/auth";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RawAsset = {
  id: string;
  asset_id: string;
  kind: "video" | "pdf";
  title_mm: string;
  title_en: string;
  duration_seconds: number | null;
};

export default async function SessionCompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const dayNumber = Number(query.day);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 47) redirect(`/${locale}/app`);

  const user = await requireUser(locale, `/${locale}/app/session-complete?day=${dayNumber}`);
  const supabase = await createClient();
  const { data: program } = await supabase.from("programs").select("id").eq("user_id", user.id).in("status", ["active", "paused", "completed"]).order("assigned_at", { ascending: false }).limit(1).maybeSingle();
  if (!program) redirect(`/${locale}/app`);

  const [{ data: session }, { data: day }] = await Promise.all([
    supabase.from("workout_sessions").select("id,started_at,completed_at").eq("program_id", program.id).eq("day_number", dayNumber).eq("status", "completed").maybeSingle(),
    supabase.from("program_days").select("id,day_type,title_mm,title_en").eq("program_id", program.id).eq("day_number", dayNumber).maybeSingle(),
  ]);
  if (!session || !day) redirect(`/${locale}/app`);

  const [{ count: exerciseCount }, { count: setCount }, { data: rawAssets }] = await Promise.all([
    supabase.from("program_day_items").select("id", { count: "exact", head: true }).eq("program_day_id", day.id),
    supabase.from("set_logs").select("id", { count: "exact", head: true }).eq("session_id", session.id),
    supabase.from("program_day_assets").select("id,asset_id,kind,title_mm,title_en,duration_seconds").eq("program_day_id", day.id).order("position"),
  ]);

  const startedAt = new Date(session.started_at).getTime();
  const completedAt = session.completed_at ? new Date(session.completed_at).getTime() : startedAt;
  const durationMinutes = Math.max(1, Math.round((completedAt - startedAt) / 60_000));
  const assets: SessionLearningAsset[] = ((rawAssets ?? []) as RawAsset[]).map((asset) => ({
    id: asset.id,
    assetId: asset.asset_id,
    kind: asset.kind,
    title: locale === "mm" ? asset.title_mm : asset.title_en,
    durationSeconds: asset.duration_seconds,
  }));

  return <SessionCompleteView locale={locale} dayNumber={dayNumber} dayType={day.day_type} title={(locale === "mm" ? day.title_mm : day.title_en) || day.day_type.toUpperCase()} exerciseCount={exerciseCount ?? 0} setCount={setCount ?? 0} durationMinutes={durationMinutes} assets={assets} />;
}
