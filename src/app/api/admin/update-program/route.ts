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
    const { client_id, duration_weeks, target_calories, macros_p, macros_c, macros_f, program_type } = body;

    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    // Upsert program targets
    await query(
      `INSERT INTO programs (user_id, duration_weeks, target_calories, macros_p, macros_c, macros_f, program_type, start_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())
       ON DUPLICATE KEY UPDATE 
       duration_weeks = VALUES(duration_weeks), 
       target_calories = VALUES(target_calories), 
       macros_p = VALUES(macros_p), 
       macros_c = VALUES(macros_c), 
       macros_f = VALUES(macros_f),
       program_type = VALUES(program_type)`,
      [
        parseInt(client_id, 10),
        parseInt(duration_weeks, 10),
        target_calories ? parseInt(target_calories, 10) : null,
        macros_p ? parseInt(macros_p, 10) : null,
        macros_c ? parseInt(macros_c, 10) : null,
        macros_f ? parseInt(macros_f, 10) : null,
        program_type || 'skinnyfat_recomp'
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Update program error:', err);
    return NextResponse.json({ error: 'Failed to update program: ' + err.message }, { status: 500 });
  }
}
