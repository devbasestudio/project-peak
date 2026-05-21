import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { userId, quote } = await request.json();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Security check: Only allow matching userId OR admin
    if (session.userId !== userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!quote || quote.trim() === '') {
      return NextResponse.json({ error: 'Quote cannot be empty.' }, { status: 400 });
    }

    await query(
      'INSERT INTO motivational_quotes (user_id, quote) VALUES (?, ?) ON DUPLICATE KEY UPDATE quote = ?',
      [userId, quote, quote]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Update quote error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
