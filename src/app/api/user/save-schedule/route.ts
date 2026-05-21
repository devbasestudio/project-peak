import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    const session = sessionCookie ? await decrypt(sessionCookie) : null;

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { schedule } = body;
    let targetUserId = session.userId;

    if (session.role === 'admin' && body.userId) {
      targetUserId = parseInt(body.userId, 10);
    }

    if (!schedule || !Array.isArray(schedule) || schedule.length !== 7) {
      return NextResponse.json({ error: '၇ ရက်စာ အစီအစဉ်အပြည့်အစုံ ရွေးချယ်ပေးပါ' }, { status: 400 });
    }

    // Begin transaction style (delete existing, then insert)
    await query('DELETE FROM weekly_schedule WHERE user_id = ?', [targetUserId]);

    for (const item of schedule) {
      const { dayOfWeek, splitName, isRest } = item;
      await query(
        'INSERT INTO weekly_schedule (user_id, day_of_week, split_name, is_rest) VALUES (?, ?, ?, ?)',
        [targetUserId, dayOfWeek, splitName, isRest ? 1 : 0]
      );
    }

    // Set onboarding complete
    await query('UPDATE users SET onboarding_complete = 1 WHERE id = ?', [targetUserId]);

    // Ensure default program row exists
    const existingPrograms = await query('SELECT id FROM programs WHERE user_id = ?', [targetUserId]);
    if (!existingPrograms || existingPrograms.length === 0) {
      await query(
        `INSERT INTO programs (user_id, duration_weeks, target_calories, macros_p, macros_c, macros_f, program_type, start_date)
         VALUES (?, 12, 1800, 150, 180, 50, 'skinnyfat_recomp', CURDATE())`,
        [targetUserId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save schedule error:', err);
    return NextResponse.json({ error: 'ဆာဗာတွင် ချို့ယွင်းချက်ရှိနေပါသည်။ ' + err.message }, { status: 500 });
  }
}
