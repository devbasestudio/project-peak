import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';
import { resolveUserRouteTarget } from '@/lib/adminView';
import { redirect } from 'next/navigation';
import SetupScheduleClient from './SetupScheduleClient';

export const dynamic = 'force-dynamic';

export default async function SetupSchedulePage(props: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await decrypt();

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'user' && session.role !== 'admin') {
    redirect('/login');
  }
  const { targetUserId } = await resolveUserRouteTarget(session, searchParams.client_id);

  // Get user details
  const users = await query('SELECT username FROM users WHERE id = ?', [targetUserId]);
  if (!users || users.length === 0) {
    redirect('/login');
  }

  // Get program_type from programs table
  const programs = await query('SELECT program_type FROM programs WHERE user_id = ?', [targetUserId]);
  const programType = programs && programs.length > 0 ? programs[0].program_type : 'skinnyfat_recomp';

  // Get existing schedule if any
  const existingSchedule = await query(
    'SELECT day_of_week, split_name, is_rest FROM weekly_schedule WHERE user_id = ? ORDER BY day_of_week ASC',
    [targetUserId]
  );

  return (
    <SetupScheduleClient
      userId={targetUserId}
      programType={programType}
      initialSchedule={existingSchedule || []}
    />
  );
}
