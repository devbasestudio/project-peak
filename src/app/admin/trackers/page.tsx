import { getClients, getRegistrations } from "@/lib/adminData";
import { createAdminClient } from "@/utils/supabase/admin";
import TrackersClient from "./TrackersClient";

export const dynamic = "force-dynamic";

export default async function AdminTrackersPage() {
  const [clients, registrations] = await Promise.all([getClients(), getRegistrations()]);
  const options = [
    ...clients.map((c) => ({ id: c.id, label: c.username || c.email || c.id })),
    ...registrations
      .filter((r) => r.user_id)
      .map((r) => ({ id: r.user_id, label: r.username || r.name || r.email || r.user_id })),
  ];
  // De-duplicate by id.
  const seen = new Set<string>();
  const clientOptions = options.filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });
  const clientIds = clientOptions.map((option) => option.id);
  const templatesByUserId: Record<string, { name: string; sections: unknown }> = {};

  if (clientIds.length > 0) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("custom_tracker_templates")
      .select("user_id, name, sections")
      .in("user_id", clientIds)
      .eq("active", true);

    if (error) {
      console.error("Could not load custom tracker templates:", error.message);
    }

    for (const template of data || []) {
      if (template.user_id) {
        templatesByUserId[template.user_id] = {
          name: template.name || "Custom tracker",
          sections: template.sections,
        };
      }
    }
  }

  return <TrackersClient clientOptions={clientOptions} templatesByUserId={templatesByUserId} />;
}
