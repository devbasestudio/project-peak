import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || (user.email === 'admin@projectpeak.com' ? 'admin' : 'user');

    const body = await request.json();
    const { schedule } = body;
    let targetUserId = user.id;

    if (userRole === 'admin' && body.userId) {
      targetUserId = body.userId;
    }

    if (!schedule || !Array.isArray(schedule) || schedule.length !== 7) {
      return NextResponse.json({ error: '၇ ရက်စာ အစီအစဉ်အပြည့်အစုံ ရွေးချယ်ပေးပါ' }, { status: 400 });
    }

    // Delete existing weekly schedule
    const { error: deleteError } = await supabase
      .from('weekly_schedule')
      .delete()
      .eq('user_id', targetUserId);

    if (deleteError) throw deleteError;

    // Insert new weekly schedule rows
    const scheduleRows = schedule.map((item) => ({
      user_id: targetUserId,
      day_of_week: item.dayOfWeek,
      split_name: item.splitName,
      is_rest: !!item.isRest,
    }));

    const { error: insertError } = await supabase
      .from('weekly_schedule')
      .insert(scheduleRows);

    if (insertError) throw insertError;

    // Set onboarding complete in profiles table
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ onboarding_complete: true })
      .eq('id', targetUserId);

    if (profileUpdateError) throw profileUpdateError;

    // Ensure default program row exists
    const { data: existingPrograms, error: programQueryError } = await supabase
      .from('programs')
      .select('id')
      .eq('user_id', targetUserId);

    if (programQueryError) throw programQueryError;

    if (!existingPrograms || existingPrograms.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      const { error: programInsertError } = await supabase
        .from('programs')
        .insert({
          user_id: targetUserId,
          duration_weeks: 12,
          target_calories: 1800,
          macros_p: 150,
          macros_c: 180,
          macros_f: 50,
          program_type: 'skinnyfat_recomp',
          start_date: today,
        });

      if (programInsertError) throw programInsertError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save schedule error:', err);
    return NextResponse.json({ error: 'ဆာဗာတွင် ချို့ယွင်းချက်ရှိနေပါသည်။ ' + err.message }, { status: 500 });
  }
}
