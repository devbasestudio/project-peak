import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import WorkoutClient from './WorkoutClient';
import Link from 'next/link';

export default async function WorkoutPage(props: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session) {
    redirect('/login');
  }

  let targetUserId = session.userId;
  let isAdminViewing = false;

  if (session.role === 'admin' && searchParams.client_id) {
    targetUserId = searchParams.client_id;
    isAdminViewing = true;
  } else if (session.role !== 'user') {
    redirect('/login');
  }

  // Get user details and check onboarding completeness
  const users = await query('SELECT username, role, email, onboarding_complete FROM users WHERE id = ?', [targetUserId]);
  if (!users || users.length === 0) {
    redirect('/login');
  }
  const targetUser = users[0];

  if (!isAdminViewing && !targetUser.onboarding_complete) {
    redirect('/user/setup-profile');
  }

  const today = new Date().toISOString().split('T')[0];
  const [year, month, day] = today.split('-').map(Number);
  const dayOfWeek = new Date(year, month - 1, day).getDay();

  // Fetch today's split from weekly schedule
  const schedules = await query(
    'SELECT split_name, is_rest FROM weekly_schedule WHERE user_id = ? AND day_of_week = ?',
    [targetUserId, dayOfWeek]
  );
  const schedule = schedules && schedules.length > 0 ? schedules[0] : null;

  const clientQuery = isAdminViewing ? `?client_id=${targetUserId}` : '';

  // Check if today is a rest day (no split, split_name is Rest, or is_rest is true)
  const isRestDay = !schedule || schedule.is_rest === 1 || schedule.split_name === 'Rest' || !schedule.split_name;

  if (isRestDay) {
    return (
      <>
        <nav className="navbar" style={{ position: 'relative', marginBottom: '2rem' }}>
          <div className="nav-brand">
            <i className="ph ph-barbell kanji"></i>
            <span>Project Peak <span className="kanji">空</span></span>
          </div>
          <div className="nav-links">
            {isAdminViewing && (
              <Link href={`/admin/client-view?id=${targetUserId}`} style={{ color: '#ef4444' }}>
                <i className="ph ph-arrow-left"></i> Back to Admin View
              </Link>
            )}
            <Link href={`/user/dashboard${clientQuery}`}>
              <i className="ph ph-squares-four"></i> Dashboard
            </Link>
            <Link href={`/user/diet${clientQuery}`}>
              <i className="ph ph-fork-knife"></i> Diet Plan
            </Link>
            <Link href={`/user/workout${clientQuery}`} className="active">
              <i className="ph ph-barbell"></i> Workout
            </Link>
            <a
              href="/logout"
              onClick={(e) => {
                e.preventDefault();
                fetch('/api/auth/logout', { method: 'POST' }).then(() => {
                  window.location.href = '/login';
                });
              }}
              style={{ color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, textDecoration: 'none' }}
            >
              <i className="ph ph-sign-out"></i> Logout
            </a>
          </div>
        </nav>

        <div className="container" style={{ paddingBottom: '4rem', maxWidth: '600px', marginTop: '2rem' }}>
          {isAdminViewing && (
            <div style={{ background: '#fee2e2', border: '1px solid #ef4444', color: '#b91c1c', padding: '1rem', borderRadius: '10px', marginBottom: '2rem' }}>
              <strong><i className="ph ph-warning-circle"></i> ADMIN MODE:</strong> You are currently managing this client&apos;s dashboard. Any changes you make here will directly affect their account.
            </div>
          )}

          <div className="glass-card" style={{ padding: '3rem 2rem', borderRadius: '24px', background: '#fff', border: '1px solid var(--glass-border)', boxShadow: 'var(--soft-shadow)', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: '#fffbeb', border: '2px solid #fbbf24', marginBottom: '1.5rem' }}>
              <i className="ph ph-sun" style={{ fontSize: '3rem', color: '#d97706' }}></i>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>It&apos;s Rest Day! (အနားယူမည့်နေ့)</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
              Rest is where the growth happens. Today is about recovery, stretching, meeting your nutrition targets, and letting your muscles rebuild stronger.
              <br />
              <span style={{ fontStyle: 'italic', display: 'block', marginTop: '1rem', color: '#d97706', fontWeight: 700 }}>
                &quot;တောင်ထိပ်ကို ရောက်ဖို့ဆိုတာ ခွန်အားတွေ ပြန်လည်စုဆောင်းခြင်းလည်း လိုအပ်ပါတယ်။&quot;
              </span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', textAlign: 'left', marginBottom: '2rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#22c55e' }}>
                  <i className="ph ph-fork-knife"></i> Nutrition
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>Stick to your macros today. Healing requires high-quality fuel.</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8' }}>
                  <i className="ph ph-drop"></i> Hydration
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>Drink at least 3 liters of water to keep your body clean and hydrated.</p>
              </div>
            </div>
            <Link href={`/user/dashboard${clientQuery}`} className="btn btn-cta" style={{ display: 'inline-flex', textDecoration: 'none', background: 'var(--btn-primary)', color: '#fff', padding: '0.8rem 2rem', borderRadius: '50px', fontWeight: 700 }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  const splitName = schedule.split_name;

  // Get user program type to fetch template
  const programs = await query('SELECT program_type FROM programs WHERE user_id = ?', [targetUserId]);
  const programType = programs && programs.length > 0 ? programs[0].program_type : 'skinnyfat_recomp';

  // Fetch workout for today
  let workouts = await query('SELECT * FROM workouts WHERE user_id = ? AND date = ?', [targetUserId, today]);
  let workout = workouts && workouts.length > 0 ? workouts[0] : null;

  if (!workout) {
    // Automatically create a workout split for today matching templates from exercise_library
    const insertResult = await query(
      'INSERT INTO workouts (user_id, date, split_name) VALUES (?, ?, ?)',
      [targetUserId, today, splitName]
    );
    const workoutId = insertResult.insertId;

    if (workoutId) {
      const templates = await query(
        'SELECT * FROM exercise_library WHERE program_type = ? AND split_name = ? ORDER BY sort_order ASC, id ASC',
        [programType, splitName]
      );

      if (templates && templates.length > 0) {
        for (const ex of templates) {
          await query(
            'INSERT INTO workout_exercises (workout_id, exercise_name, target_sets, target_reps) VALUES (?, ?, ?, ?)',
            [workoutId, ex.exercise_name, ex.sets_default, ex.reps_default]
          );
        }
      } else {
        // Fallback exercises
        const fallbackExercises = [
          { name: 'Barbell Bench Press', sets: 3, reps: '8-10' },
          { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12' },
          { name: 'Overhead Press', sets: 3, reps: '8-10' },
          { name: 'Tricep Pushdown', sets: 3, reps: '12-15' }
        ];

        for (const ex of fallbackExercises) {
          await query(
            'INSERT INTO workout_exercises (workout_id, exercise_name, target_sets, target_reps) VALUES (?, ?, ?, ?)',
            [workoutId, ex.name, ex.sets, ex.reps]
          );
        }
      }

      // Fetch the newly created workout
      const newWorkouts = await query('SELECT * FROM workouts WHERE id = ?', [workoutId]);
      workout = newWorkouts && newWorkouts.length > 0 ? newWorkouts[0] : null;
    }
  }

  let exercises: any[] = [];
  let mappedExercises: any[] = [];
  if (workout) {
    exercises = await query('SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY id ASC', [workout.id]);

    // Load templates to get original library IDs
    const templates = await query(
      'SELECT * FROM exercise_library WHERE program_type = ? AND split_name = ? ORDER BY sort_order ASC, id ASC',
      [programType, splitName]
    );

    mappedExercises = exercises.map((ex: any, idx: number) => {
      const template = templates[idx] || null;
      return {
        ...ex,
        original_exercise_id: template ? template.id : null,
        muscle_group: template ? template.muscle_group : null,
      };
    });
  }

  // Fetch all library exercises for swap options
  const allLibraryExercises = await query(
    'SELECT id, exercise_name, muscle_group, sets_default, reps_default FROM exercise_library ORDER BY exercise_name ASC'
  );

  // Fetch historical logs for user's completed sessions
  const historicalLogs = await query(
    `SELECT we.exercise_name, we.actual_weight, we.actual_reps, w.date
     FROM workout_exercises we
     JOIN workouts w ON we.workout_id = w.id
     WHERE w.user_id = ? AND w.completed = 1
     ORDER BY w.date DESC, w.id DESC`,
    [targetUserId]
  );

  const lastSessionLogs: Record<string, { weight: string; reps: string; date: string }> = {};
  if (historicalLogs && historicalLogs.length > 0) {
    historicalLogs.forEach((log: any) => {
      if (!lastSessionLogs[log.exercise_name]) {
        lastSessionLogs[log.exercise_name] = {
          weight: log.actual_weight || '',
          reps: log.actual_reps || '',
          date: log.date ? new Date(log.date).toISOString().split('T')[0] : '',
        };
      }
    });
  }

  return (
    <WorkoutClient
      targetUserId={targetUserId}
      isAdminViewing={isAdminViewing}
      clientQuery={clientQuery}
      today={today}
      workout={workout}
      exercises={mappedExercises}
      allLibraryExercises={allLibraryExercises || []}
      lastSessionLogs={lastSessionLogs}
    />
  );
}

