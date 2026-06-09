import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
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
