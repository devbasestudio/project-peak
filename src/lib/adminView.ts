import type { SessionPayload } from "./session";
import { createAdminClient } from "@/utils/supabase/admin";

export async function resolveUserRouteTarget(session: SessionPayload, requestedClientId?: string) {
  if (session.role !== "admin") {
    return { targetUserId: session.userId, isAdminViewing: false };
  }

  if (requestedClientId) {
    return { targetUserId: requestedClientId, isAdminViewing: true };
  }

  const { data: firstClient } = await createAdminClient()
    .from("profiles")
    .select("id")
    .eq("role", "user")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    targetUserId: firstClient?.id || session.userId,
    isAdminViewing: true,
  };
}
