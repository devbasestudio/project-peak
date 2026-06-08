import { getClients, getRegistrations } from "@/lib/adminData";
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

  return <TrackersClient clientOptions={clientOptions} />;
}
