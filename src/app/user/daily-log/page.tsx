import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import DailyLogClient from './DailyLogClient';

export default async function DailyLogPage(props: {
  searchParams: Promise<{ w?: string; client_id?: string }>;
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

  const weekOffset = parseInt(searchParams.w || '1', 10);

  // Get program start date
  const programs = await query('SELECT start_date FROM programs WHERE user_id = ?', [targetUserId]);
  let startDateStr = programs && programs.length > 0 ? programs[0].start_date : null;
  
  if (!startDateStr) {
    // If no start date, default to current date
    const d = new Date();
    startDateStr = d.toISOString().split('T')[0];
  }

  const startDateObj = new Date(startDateStr);
  
  // Find Monday of the start date week
  const startDay = startDateObj.getDay();
  const diff = startDateObj.getDate() - startDay + (startDay === 0 ? -6 : 1);
  const mondayOfStartWeek = new Date(startDateObj.setDate(diff));

  // Shift by (weekOffset - 1) weeks
  const weekStart = new Date(mondayOfStartWeek);
  weekStart.setDate(weekStart.getDate() + (weekOffset - 1) * 7);

  // Generate 7 days of the week
  const days: { name: string; date: string }[] = [];
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const dateStr = day.toISOString().split('T')[0];
    days.push({ name: daysOfWeek[i], date: dateStr });
  }

  const dateListStr = days.map((d) => `'${d.date}'`).join(',');

  // Fetch tracker & journal data for this week's dates
  let trackerDataList: any[] = [];
  let journalDataList: any[] = [];

  if (dateListStr) {
    trackerDataList = await query(
      `SELECT * FROM daily_trackers WHERE user_id = ? AND date IN (${dateListStr})`,
      [targetUserId]
    );
    journalDataList = await query(
      `SELECT * FROM journaling WHERE user_id = ? AND date IN (${dateListStr})`,
      [targetUserId]
    );
  }

  // Convert to mapping format
  const trackerMap: Record<string, any> = {};
  const journalMap: Record<string, any> = {};

  const formatDate = (d: any) => {
    if (!d) return '';
    if (d instanceof Date) return d.toISOString().split('T')[0];
    if (typeof d === 'string') return d.split('T')[0];
    return String(d);
  };

  days.forEach((d) => {
    trackerMap[d.date] = trackerDataList.find((t) => formatDate(t.date) === d.date) || {};
    journalMap[d.date] = journalDataList.find((j) => formatDate(j.date) === d.date) || {};
  });

  // Check if today falls in the week
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch today's entry specifically in case it is not in the viewed week (needed for the log form)
  let todayTracker = {};
  let todayJournal = {};
  if (trackerMap[today]) {
    todayTracker = trackerMap[today];
  } else {
    const todayTrackers = await query('SELECT * FROM daily_trackers WHERE user_id = ? AND date = ?', [targetUserId, today]);
    todayTracker = todayTrackers && todayTrackers.length > 0 ? todayTrackers[0] : {};
  }

  if (journalMap[today]) {
    todayJournal = journalMap[today];
  } else {
    const todayJournals = await query('SELECT * FROM journaling WHERE user_id = ? AND date = ?', [targetUserId, today]);
    todayJournal = todayJournals && todayJournals.length > 0 ? todayJournals[0] : {};
  }

  const clientQuery = isAdminViewing ? `?client_id=${targetUserId}` : '';

  return (
    <DailyLogClient
      targetUserId={targetUserId}
      isAdminViewing={isAdminViewing}
      clientQuery={clientQuery}
      weekOffset={weekOffset}
      days={days}
      trackerMap={trackerMap}
      journalMap={journalMap}
      today={today}
      todayTracker={todayTracker}
      todayJournal={todayJournal}
    />
  );
}
