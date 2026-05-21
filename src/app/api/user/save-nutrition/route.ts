import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, date, nutritionItemId, completed } = body;

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Security check: Only allow matching user OR admin
    if (session.userId !== userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!date || !nutritionItemId) {
      return NextResponse.json({ error: 'Date and nutritionItemId are required.' }, { status: 400 });
    }

    // Upsert into nutrition_logs
    await query(
      `INSERT INTO nutrition_logs (user_id, date, nutrition_item_id, completed)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE completed = ?`,
      [userId, date, nutritionItemId, completed ? 1 : 0, completed ? 1 : 0]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save nutrition error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
