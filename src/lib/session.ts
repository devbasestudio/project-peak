import { createClient } from '@/utils/supabase/server';

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

    // Fetch user role and username from the public profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || (user.email === 'admin@projectpeak.com' ? 'admin' : 'user');
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
