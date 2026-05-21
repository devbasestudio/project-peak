import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, workoutExerciseId, originalExerciseId, replacementExerciseId } = body;

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

    if (!originalExerciseId || !replacementExerciseId) {
      return NextResponse.json({ error: 'Original and replacement exercise IDs are required.' }, { status: 400 });
    }

    // Save persistent swap mapping
    await query(
      `INSERT INTO exercise_swaps (user_id, original_exercise_id, replacement_exercise_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE replacement_exercise_id = ?`,
      [userId, originalExerciseId, replacementExerciseId, replacementExerciseId]
    );

    // Fetch replacement details
    const replacements = await query(
      'SELECT exercise_name, sets_default, reps_default FROM exercise_library WHERE id = ?',
      [replacementExerciseId]
    );

    if (replacements && replacements.length > 0 && workoutExerciseId) {
      const repEx = replacements[0];
      // Update today's active exercise record
      await query(
        `UPDATE workout_exercises 
         SET exercise_name = ?, target_sets = ?, target_reps = ?, actual_weight = NULL, actual_reps = NULL
         WHERE id = ?`,
        [repEx.exercise_name, repEx.sets_default, repEx.reps_default, workoutExerciseId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Swap exercise error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
