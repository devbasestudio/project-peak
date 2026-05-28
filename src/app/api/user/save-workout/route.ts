import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, workoutId, exercises, userFeelings, userNotes } = body;

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

    if (!workoutId) {
      return NextResponse.json({ error: 'Workout ID is required.' }, { status: 400 });
    }

    // Update exercises
    if (Array.isArray(exercises)) {
      for (const ex of exercises) {
        const { error: exError } = await supabase
          .from('workout_exercises')
          .update({
            actual_weight: ex.actualWeight,
            actual_reps: ex.actualReps,
          })
          .eq('id', ex.id)
          .eq('workout_id', workoutId);

        if (exError) throw exError;
      }
    }

    // Update workout status
    const { error: workoutError } = await supabase
      .from('workouts')
      .update({
        user_notes: userNotes,
        user_feelings: userFeelings,
        completed: true,
      })
      .eq('id', workoutId)
      .eq('user_id', userId);

    if (workoutError) throw workoutError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save workout error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
