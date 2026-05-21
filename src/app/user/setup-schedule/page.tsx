import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import SetupScheduleClient from './SetupScheduleClient';

export default async function SetupSchedulePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'user') {
    redirect('/login');
  }

  // Get user details
  const users = await query('SELECT username FROM users WHERE id = ?', [session.userId]);
  if (!users || users.length === 0) {
    redirect('/login');
  }

  // Get program_type from programs table
  const programs = await query('SELECT program_type FROM programs WHERE user_id = ?', [session.userId]);
  const programType = programs && programs.length > 0 ? programs[0].program_type : 'skinnyfat_recomp';

  // Get existing schedule if any
  const existingSchedule = await query(
    'SELECT day_of_week, split_name, is_rest FROM weekly_schedule WHERE user_id = ? ORDER BY day_of_week ASC',
    [session.userId]
  );

  return (
    <SetupScheduleClient
      userId={session.userId}
      programType={programType}
      initialSchedule={existingSchedule || []}
    />
  );
}
