import { notFound, redirect } from "next/navigation";
import { BaselineFlow } from "@/components/app-shell/baseline-flow";
import { ProgramBlocks, type ProgramBlock } from "@/components/app-shell/program-blocks";
import { isLocale } from "@/lib/i18n";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BaselinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await requireViewer(locale, `/${locale}/app/baseline`);
  const supabase = await createClient();
  const { data: program } = await supabase.from("programs").select("id").eq("user_id", viewer.user.id).eq("status", "active").limit(1).maybeSingle();
  if (!program) redirect(`/${locale}/app`);
  const { count } = await supabase.from("assessment_attempts").select("id", { count: "exact", head: true }).eq("program_id", program.id).eq("kind", "baseline").eq("status", "completed");
  if (count) redirect(`/${locale}/app`);
  const { data: movements } = await supabase.from("program_assessment_movements").select("id,name_mm,name_en,equipment_mm,equipment_en").eq("program_id", program.id).eq("assessment_kind", "baseline").order("position");
  if (!movements?.length) throw new Error("Baseline movements are not configured");
  const { data: document } = await supabase.from("program_documents").select("id").eq("program_id", program.id).eq("screen_key", "baseline_intro").maybeSingle();
  const { data: blocks } = document ? await supabase.from("program_blocks").select("id,block_type,title_mm,title_en,content_mm,content_en,config,visible").eq("document_id", document.id).order("position") : { data: [] };
  return <><ProgramBlocks locale={locale} blocks={(blocks ?? []) as ProgramBlock[]} /><BaselineFlow locale={locale} programId={program.id} movements={movements} /></>;
}
