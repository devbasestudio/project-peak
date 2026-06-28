import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      date,
      bodyWeight,
      steps,
      sleepScore,
      water3l,
      omega3,
      bedPhoneFilter,
      mealPlanAdhered,
      toilet,
      dietStatus,
      satisfiedWith,
      difficultWith,
      wakeTime,
      phoneOffTime,
      waterLiters,
      oneWin,
      oneStruggle,
      trackerValues,
    } = body;

    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    // Data access via service role (RLS blocks the authenticated client).
    const supabase = createAdminClient();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Retrieve user's role from the public profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || (user.email === 'admin@projectpeak.com' ? 'admin' : 'user');

    // Security check: Only allow matching user OR admin
    if (user.id !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Date is required.' }, { status: 400 });
    }

    // Normalize empty values
    const bodyWeightVal = bodyWeight !== undefined && bodyWeight !== '' && bodyWeight !== null ? bodyWeight : null;
    const stepsVal = steps !== undefined && steps !== '' && steps !== null ? steps : null;
    const sleepScoreVal = sleepScore !== undefined && sleepScore !== '' && sleepScore !== null ? sleepScore : null;
    const water3lVal = !!water3l;
    const omega3Val = !!omega3;
    const bedPhoneFilterVal = !!bedPhoneFilter;
    const mealPlanAdheredVal = !!mealPlanAdhered;
    const toiletVal = !!toilet;

    const dietStatusVal = dietStatus !== undefined && dietStatus !== '' && dietStatus !== null ? dietStatus : null;
    const satisfiedWithVal = satisfiedWith !== undefined && satisfiedWith !== '' && satisfiedWith !== null ? satisfiedWith : null;
    const difficultWithVal = difficultWith !== undefined && difficultWith !== '' && difficultWith !== null ? difficultWith : null;

    // Upsert daily_trackers
    const { error: trackerError } = await supabase
      .from('daily_trackers')
      .upsert({
        user_id: userId,
        date,
        body_weight: bodyWeightVal,
        steps: stepsVal,
        sleep_score: sleepScoreVal,
        water_3l: water3lVal,
        omega_3: omega3Val,
        bed_phone_filter: bedPhoneFilterVal,
        meal_plan_adhered: mealPlanAdheredVal,
        toilet: toiletVal,
      }, { onConflict: 'user_id, date' });

    if (trackerError) throw trackerError;

    const optionalTrackerFields: Record<string, unknown> = {};
    if (wakeTime !== undefined) optionalTrackerFields.wake_time = wakeTime || null;
    if (phoneOffTime !== undefined) optionalTrackerFields.phone_off_time = phoneOffTime || null;
    if (waterLiters !== undefined) optionalTrackerFields.water_liters = waterLiters || null;
    if (oneWin !== undefined) optionalTrackerFields.one_win = oneWin || null;
    if (oneStruggle !== undefined) optionalTrackerFields.one_struggle = oneStruggle || null;
    const shouldSaveTrackerValues = trackerValues !== undefined && trackerValues && typeof trackerValues === 'object' && !Array.isArray(trackerValues);

    if (Object.keys(optionalTrackerFields).length > 0) {
      const { error: optionalTrackerError } = await supabase
        .from('daily_trackers')
        .update(optionalTrackerFields)
        .eq('user_id', userId)
        .eq('date', date);

      if (optionalTrackerError) throw optionalTrackerError;
    }

    if (shouldSaveTrackerValues) {
      const { error: trackerValuesError } = await supabase
        .from('daily_trackers')
        .update({ tracker_values: trackerValues })
        .eq('user_id', userId)
        .eq('date', date);

      const missingTrackerValuesColumn =
        trackerValuesError?.code === '42703'
        || trackerValuesError?.code === 'PGRST204'
        || String(trackerValuesError?.message || '').includes('tracker_values');
      if (trackerValuesError && !missingTrackerValuesColumn) throw trackerValuesError;
    }

    // Upsert journaling
    const { error: journalError } = await supabase
      .from('journaling')
      .upsert({
        user_id: userId,
        date,
        diet_status: dietStatusVal,
        satisfied_with: satisfiedWithVal,
        difficult_with: difficultWithVal,
      }, { onConflict: 'user_id, date' });

    if (journalError) throw journalError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save daily log error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
