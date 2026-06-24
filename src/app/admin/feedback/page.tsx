import { feedbackTemplates } from "@/lib/projectPeakConfig";
import { getPublicProjectPrograms } from "@/lib/programCatalog";
import { createAdminClient } from "@/utils/supabase/admin";
import FeedbackClient from "./FeedbackClient";

export const dynamic = "force-dynamic";

function fallbackTemplates() {
  return feedbackTemplates.map((template, index) => ({
    id: `fallback-${index}`,
    name: template.name,
    cadence: template.cadence.toLowerCase(),
    fields: template.fields.map((label) => ({ type: "text", label })),
    active: template.status === "Ready",
  }));
}

export default async function AdminFeedbackPage() {
  const supabase = createAdminClient();
  const [{ data, error }, programs] = await Promise.all([
    supabase
      .from("feedback_form_templates")
      .select("id, name, cadence, fields, active")
      .order("created_at", { ascending: true }),
    getPublicProjectPrograms({ fresh: true }),
  ]);

  const templates = !error && data?.length ? data : fallbackTemplates();
  return <FeedbackClient templates={templates} programs={programs.map((program) => ({ key: program.key, name: program.name }))} />;
}
