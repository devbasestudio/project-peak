import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, workoutId, exercises, userFeelings, userNotes } = body;

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

    if (!workoutId) {
      return NextResponse.json({ error: 'Workout ID is required.' }, { status: 400 });
    }

    // Update exercises
    if (Array.isArray(exercises)) {
      for (const ex of exercises) {
        await query(
          'UPDATE workout_exercises SET actual_weight = ?, actual_reps = ? WHERE id = ? AND workout_id = ?',
          [ex.actualWeight, ex.actualReps, ex.id, workoutId]
        );
      }
    }

    // Update workout status
    await query(
      'UPDATE workouts SET user_notes = ?, user_feelings = ?, completed = 1 WHERE id = ? AND user_id = ?',
      [userNotes, userFeelings, workoutId, userId]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save workout error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
