import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, workoutExerciseId, originalExerciseId, replacementExerciseId } = body;

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

    // Security check: Only allow matching user OR admin
    if (user.id !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!originalExerciseId || !replacementExerciseId) {
      return NextResponse.json({ error: 'Original and replacement exercise IDs are required.' }, { status: 400 });
    }

    // Save persistent swap mapping
    const { error: swapError } = await supabase
      .from('exercise_swaps')
      .upsert({
        user_id: userId,
        original_exercise_id: originalExerciseId,
        replacement_exercise_id: replacementExerciseId,
      }, { onConflict: 'user_id, original_exercise_id' });

    if (swapError) throw swapError;

    // Fetch replacement details
    const { data: replacements, error: libraryError } = await supabase
      .from('exercise_library')
      .select('exercise_name, sets_default, reps_default')
      .eq('id', replacementExerciseId);

    if (libraryError) throw libraryError;

    if (replacements && replacements.length > 0 && workoutExerciseId) {
      const repEx = replacements[0];
      // Update today's active exercise record
      const { error: exError } = await supabase
        .from('workout_exercises')
        .update({
          exercise_name: repEx.exercise_name,
          target_sets: repEx.sets_default,
          target_reps: repEx.reps_default,
          actual_weight: null,
          actual_reps: null,
        })
        .eq('id', workoutExerciseId);

      if (exError) throw exError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Swap exercise error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
