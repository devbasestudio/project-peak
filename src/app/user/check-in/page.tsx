import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import CheckInClient from './CheckInClient';

export default async function CheckInPage(props: {
  searchParams: Promise<{ client_id?: string; w?: string }>;
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

  const users = await query('SELECT onboarding_complete FROM users WHERE id = ?', [targetUserId]);
  const onboardingComplete = users && users.length > 0 ? users[0].onboarding_complete : 0;
  if (!isAdminViewing && !onboardingComplete) {
    redirect('/user/setup-profile');
  }

  // Get current week number based on program start date
  const programs = await query('SELECT start_date FROM programs WHERE user_id = ?', [targetUserId]);
  let startDateStr = programs && programs.length > 0 ? programs[0].start_date : null;
  
  if (!startDateStr) {
    const d = new Date();
    startDateStr = d.toISOString().split('T')[0];
  }

  // Format startDateStr if it is a Date object from mysql
  if (startDateStr instanceof Date) {
    startDateStr = startDateStr.toISOString().split('T')[0];
  }

  const startDateObj = new Date(startDateStr);
  const todayObj = new Date();
  
  // Set times to midnight to calculate correct days diff
  startDateObj.setHours(0, 0, 0, 0);
  todayObj.setHours(0, 0, 0, 0);

  const diffTime = todayObj.getTime() - startDateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // If w parameter is provided, use it, otherwise use current week
  const currentWeek = searchParams.w ? parseInt(searchParams.w, 10) : Math.max(1, Math.floor(diffDays / 7) + 1);

  // Check if check-in exists for this week
  const checkins = await query(
    'SELECT * FROM weekly_checkins WHERE user_id = ? AND week_number = ?',
    [targetUserId, currentWeek]
  );
  const existingCheckin = checkins && checkins.length > 0 ? checkins[0] : null;

  // Calculate actual average weight from daily trackers for the past week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const avgWeightResult = await query(
    'SELECT AVG(body_weight) as avg_w FROM daily_trackers WHERE user_id = ? AND date >= ? AND body_weight IS NOT NULL',
    [targetUserId, weekAgoStr]
  );
  let calcAvgWeight = avgWeightResult && avgWeightResult.length > 0 ? avgWeightResult[0].avg_w : '';
  if (calcAvgWeight) {
    calcAvgWeight = parseFloat(calcAvgWeight).toFixed(2);
  }

  const clientQuery = isAdminViewing ? `?client_id=${targetUserId}` : '';

  return (
    <CheckInClient
      targetUserId={targetUserId}
      isAdminViewing={isAdminViewing}
      clientQuery={clientQuery}
      currentWeek={currentWeek}
      existingCheckin={existingCheckin}
      calcAvgWeight={calcAvgWeight.toString()}
    />
  );
}
