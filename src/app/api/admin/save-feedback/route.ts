import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: Request) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    // Data access via service role (RLS blocks the authenticated client).
    const supabase = createAdminClient();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || (user.email === 'admin@projectpeak.com' ? 'admin' : 'user');

    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { checkin_id, admin_feedback } = body;

    if (!checkin_id) {
      return NextResponse.json({ error: 'Check-in ID is required' }, { status: 400 });
    }

    const { error: feedbackError } = await supabase
      .from('weekly_checkins')
      .update({ admin_feedback: admin_feedback || null })
      .eq('id', checkin_id);

    if (feedbackError) throw feedbackError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save feedback error:', err);
    return NextResponse.json({ error: 'Failed to save feedback: ' + err.message }, { status: 500 });
  }
}
