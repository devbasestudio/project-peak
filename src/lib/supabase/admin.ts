import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export function createAdminClient() {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.supabaseUrl || !serviceRole) throw new Error("Supabase admin environment is not configured");
  return createClient(env.supabaseUrl, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });
}
