import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { ADMIN_EMAIL, ensureAdminAccount } from './adminAuth';

export interface SessionPayload {
  userId: string;
  role: 'admin' | 'user';
  username: string;
  email: string;
}

export async function decrypt(token?: string): Promise<SessionPayload | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    // Fetch role/username via the service-role client — the authenticated
    // client is blocked by RLS from reading its own profiles row.
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .single();

    if (user.email === ADMIN_EMAIL && profile?.role !== 'admin') {
      await ensureAdminAccount();
    }

    const role = user.email === ADMIN_EMAIL ? 'admin' : profile?.role || 'user';
    const username = profile?.username || user.user_metadata?.username || 'User';

    return {
      userId: user.id,
      role,
      username,
      email: user.email || '',
    };
  } catch (err) {
    console.error('Error in session decrypt adapter:', err);
    return null;
  }
}
export default decrypt;
