import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';

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
    } = body;

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

    if (!date) {
      return NextResponse.json({ error: 'Date is required.' }, { status: 400 });
    }

    // Normalize undefined fields to null or appropriate defaults to prevent mysql2 driver crash
    const bodyWeightVal = bodyWeight !== undefined && bodyWeight !== '' && bodyWeight !== null ? bodyWeight : null;
    const stepsVal = steps !== undefined && steps !== '' && steps !== null ? steps : null;
    const sleepScoreVal = sleepScore !== undefined && sleepScore !== '' && sleepScore !== null ? sleepScore : null;
    const water3lVal = water3l ? 1 : 0;
    const omega3Val = omega3 ? 1 : 0;
    const bedPhoneFilterVal = bedPhoneFilter ? 1 : 0;
    const mealPlanAdheredVal = mealPlanAdhered ? 1 : 0;
    const toiletVal = toilet ? 1 : 0;

    const dietStatusVal = dietStatus !== undefined && dietStatus !== '' && dietStatus !== null ? dietStatus : null;
    const satisfiedWithVal = satisfiedWith !== undefined && satisfiedWith !== '' && satisfiedWith !== null ? satisfiedWith : null;
    const difficultWithVal = difficultWith !== undefined && difficultWith !== '' && difficultWith !== null ? difficultWith : null;

    // Upsert daily_trackers
    await query(
      `INSERT INTO daily_trackers 
       (user_id, date, body_weight, steps, sleep_score, water_3l, omega_3, bed_phone_filter, meal_plan_adhered, toilet) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       body_weight = ?, steps = ?, sleep_score = ?, water_3l = ?, omega_3 = ?, bed_phone_filter = ?, meal_plan_adhered = ?, toilet = ?`,
      [
        userId,
        date,
        bodyWeightVal,
        stepsVal,
        sleepScoreVal,
        water3lVal,
        omega3Val,
        bedPhoneFilterVal,
        mealPlanAdheredVal,
        toiletVal,
        bodyWeightVal,
        stepsVal,
        sleepScoreVal,
        water3lVal,
        omega3Val,
        bedPhoneFilterVal,
        mealPlanAdheredVal,
        toiletVal,
      ]
    );

    // Upsert journaling
    await query(
      `INSERT INTO journaling 
       (user_id, date, diet_status, satisfied_with, difficult_with) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       diet_status = ?, satisfied_with = ?, difficult_with = ?`,
      [
        userId,
        date,
        dietStatusVal,
        satisfiedWithVal,
        difficultWithVal,
        dietStatusVal,
        satisfiedWithVal,
        difficultWithVal,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save daily log error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
