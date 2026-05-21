import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { checkin_id, admin_feedback } = body;

    if (!checkin_id) {
      return NextResponse.json({ error: 'Check-in ID is required' }, { status: 400 });
    }

    await query(
      'UPDATE weekly_checkins SET admin_feedback = ? WHERE id = ?',
      [admin_feedback || null, parseInt(checkin_id, 10)]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save feedback error:', err);
    return NextResponse.json({ error: 'Failed to save feedback: ' + err.message }, { status: 500 });
  }
}
