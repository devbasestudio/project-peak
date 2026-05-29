import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for TRUSTED SERVER-SIDE data access only.
 *
 * The app's tables have RLS enabled without read/write policies for the
 * authenticated role, so the cookie-based (anon) client cannot see a user's
 * own rows — which previously caused an infinite /login ↔ /user/dashboard
 * redirect loop. All data access happens server-side and is always scoped by
 * an already-authenticated userId, so using the service role here is safe.
 *
 * NEVER import this in client components or expose the key to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
