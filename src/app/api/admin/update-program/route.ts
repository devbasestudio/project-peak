import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { saveUserProgram } from '@/lib/userProgram';

export async function POST(request: Request) {
  const { supabase, error, status } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await request.json();
    const { client_id, duration_weeks, target_calories, macros_p, macros_c, macros_f, program_type } = body;

    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    await saveUserProgram(supabase, {
      user_id: client_id,
      duration_weeks: parseInt(duration_weeks, 10),
      target_calories: target_calories ? parseInt(target_calories, 10) : null,
      macros_p: macros_p ? parseInt(macros_p, 10) : null,
      macros_c: macros_c ? parseInt(macros_c, 10) : null,
      macros_f: macros_f ? parseInt(macros_f, 10) : null,
      program_type: program_type || 'skinnyfat_recomp',
      start_date: today,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Update program error:', err);
    return NextResponse.json({ error: 'Failed to update program: ' + err.message }, { status: 500 });
  }
}
