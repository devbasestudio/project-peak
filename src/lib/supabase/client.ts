"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!env.supabaseUrl || !env.supabasePublishableKey) throw new Error("Supabase browser environment is not configured");
  browserClient ??= createBrowserClient(env.supabaseUrl, env.supabasePublishableKey);
  return browserClient;
}
