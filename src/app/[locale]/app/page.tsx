import { notFound } from "next/navigation";
import { CustomerDashboard } from "@/components/app-shell/customer-dashboard";
import { isLocale } from "@/lib/i18n";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ProgramBlock } from "@/components/app-shell/program-blocks";

export const dynamic = "force-dynamic";

export default async function MemberHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await requireViewer(locale);
  const supabase = await createClient();

  const [{ data: order }, { data: rawProgram }] = await Promise.all([
    supabase.from("payment_orders").select("reference_code,status,amount_minor,currency").eq("user_id", viewer.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("programs").select("id,status,name_mm,name_en").eq("user_id", viewer.user.id).eq("status", "active").order("assigned_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  let program = null;
  let habits = null;
  let programBlocks: ProgramBlock[] = [];
  if (rawProgram) {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Yangon" }).format(new Date());
    const [{ count }, { count: baselineCount }, { data: habit }] = await Promise.all([
      supabase.from("workout_sessions").select("id", { count: "exact", head: true }).eq("program_id", rawProgram.id).eq("status", "completed"),
      supabase.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("program_id", rawProgram.id).eq("kind", "baseline").eq("status", "completed"),
      supabase.from("habit_logs").select("protein,water,sleep_hours").eq("program_id", rawProgram.id).eq("local_date", today).maybeSingle(),
    ]);
    program = { ...rawProgram, completed: count ?? 0, hasBaseline: Boolean(baselineCount) };
    habits = habit;
    if ((count ?? 0) === 12) {
      const { data: document } = await supabase.from("program_documents").select("id").eq("program_id", rawProgram.id).eq("screen_key", "phase_2_transition").maybeSingle();
      if (document) {
        const { data } = await supabase.from("program_blocks").select("id,block_type,title_mm,title_en,content_mm,content_en,config,visible").eq("document_id", document.id).order("position");
        programBlocks = (data ?? []) as ProgramBlock[];
      }
    }
  }

  return <CustomerDashboard locale={locale} order={order} program={program} email={viewer.user.email ?? ""} habits={habits} programBlocks={programBlocks} />;
}
