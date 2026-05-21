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
    const { height, weight, age, bodyFat, desiredBodyText } = body;
    let targetUserId = session.userId;

    // If admin is managing, allow setting different client ID
    if (session.role === 'admin' && body.userId) {
      targetUserId = parseInt(body.userId, 10);
    }

    if (!height || !weight || !age || !bodyFat) {
      return NextResponse.json({ error: 'အချက်အလက်အားလုံး ပြည့်စုံစွာ ဖြည့်သွင်းပေးပါ' }, { status: 400 });
    }

    // Upsert user profile using INSERT ... ON DUPLICATE KEY UPDATE
    await query(
      `INSERT INTO user_profiles (user_id, height_cm, starting_weight, age, body_fat_percent, desired_body_text)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       height_cm = VALUES(height_cm),
       starting_weight = VALUES(starting_weight),
       age = VALUES(age),
       body_fat_percent = VALUES(body_fat_percent),
       desired_body_text = VALUES(desired_body_text)`,
      [targetUserId, parseFloat(height), parseFloat(weight), parseInt(age, 10), parseInt(bodyFat, 10), desiredBodyText || '']
    );

    // Also insert or update the first daily tracker entry weight as baseline
    const today = new Date().toISOString().split('T')[0];
    await query(
      `INSERT INTO daily_trackers (user_id, date, body_weight)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       body_weight = VALUES(body_weight)`,
      [targetUserId, today, parseFloat(weight)]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save profile error:', err);
    return NextResponse.json({ error: 'ဆာဗာတွင် ချို့ယွင်းချက်ရှိနေပါသည်။ ' + err.message }, { status: 500 });
  }
}
