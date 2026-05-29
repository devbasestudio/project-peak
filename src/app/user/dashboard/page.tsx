import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage(props: {
  searchParams: Promise<{ client_id?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await decrypt();

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

  // Get user details
  const users = await query('SELECT username, role, email, onboarding_complete FROM users WHERE id = ?', [targetUserId]);
  if (!users || users.length === 0) {
    redirect('/login');
  }
  const targetUser = users[0];

  if (!isAdminViewing && !targetUser.onboarding_complete) {
    redirect('/user/setup-profile');
  }

  // Get profile details
  const profiles = await query(
    'SELECT age, starting_weight, height_cm, body_fat_percent, desired_body_text FROM user_profiles WHERE user_id = ?',
    [targetUserId]
  );
  const profile = profiles && profiles.length > 0 ? profiles[0] : null;

  // Get program details
  const programs = await query('SELECT * FROM programs WHERE user_id = ?', [targetUserId]);
  const program = programs && programs.length > 0 ? programs[0] : null;

  // Get quote
  const quotes = await query('SELECT quote FROM motivational_quotes WHERE user_id = ?', [targetUserId]);
  const quote = quotes && quotes.length > 0 ? quotes[0].quote : 'Believe in yourself and exceed your limits!';

  // Timezone-safe today and yesterday strings (YYYY-MM-DD)
  // Let's use local server time adjusting for offset
  const todayObj = new Date();
  const tzOffset = todayObj.getTimezoneOffset() * 60000;
  const todayStr = new Date(todayObj.getTime() - tzOffset).toISOString().split('T')[0];
  
  const yesterdayObj = new Date(todayObj.getTime() - 86400000);
  const yesterdayStr = new Date(yesterdayObj.getTime() - tzOffset).toISOString().split('T')[0];

  // Fetch today's daily log
  const todayLogs = await query(
    'SELECT * FROM daily_trackers WHERE user_id = ? AND date = ?',
    [targetUserId, todayStr]
  );
  const todayLog = todayLogs && todayLogs.length > 0 ? todayLogs[0] : null;

  // Fetch yesterday's daily log weight
  const yesterdayLogs = await query(
    'SELECT body_weight FROM daily_trackers WHERE user_id = ? AND date = ?',
    [targetUserId, yesterdayStr]
  );
  const yesterdayWeight = yesterdayLogs && yesterdayLogs.length > 0 && yesterdayLogs[0].body_weight 
    ? parseFloat(yesterdayLogs[0].body_weight) 
    : (profile?.starting_weight ? parseFloat(profile.starting_weight) : null);

  // Fetch today's weekly schedule split name
  const dayOfWeek = todayObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const schedules = await query(
    'SELECT split_name, is_rest FROM weekly_schedule WHERE user_id = ? AND day_of_week = ?',
    [targetUserId, dayOfWeek]
  );
  const schedule = schedules && schedules.length > 0 ? schedules[0] : null;

  // Fetch meal completion log counts & calories for today
  const programType = program?.program_type || 'skinnyfat_recomp';
  const allNutritionItems = await query(
    'SELECT id, calories FROM nutrition_items WHERE program_type = ?',
    [programType]
  );
  const totalMealsCount = allNutritionItems.length;

  const completedMeals = await query(
    `SELECT nl.nutrition_item_id, ni.calories, ni.protein_g, ni.carbs_g, ni.fat_g
     FROM nutrition_logs nl
     JOIN nutrition_items ni ON nl.nutrition_item_id = ni.id
     WHERE nl.user_id = ? AND nl.date = ? AND nl.completed = 1`,
    [targetUserId, todayStr]
  );

  let consumedCalories = 0;
  let consumedProtein = 0;
  let consumedCarbs = 0;
  let consumedFat = 0;

  completedMeals.forEach((meal: any) => {
    consumedCalories += meal.calories || 0;
    consumedProtein += parseFloat(meal.protein_g || 0);
    consumedCarbs += parseFloat(meal.carbs_g || 0);
    consumedFat += parseFloat(meal.fat_g || 0);
  });

  // Calculate streak count based on daily_trackers entries with activity
  const allTrackers = await query(
    'SELECT date, body_weight, steps, water_3l, omega_3, bed_phone_filter, toilet FROM daily_trackers WHERE user_id = ? ORDER BY date DESC',
    [targetUserId]
  );

  const activeDates = new Set<string>();
  allTrackers.forEach((t: any) => {
    const hasActivity = t.body_weight !== null || t.steps !== null || t.water_3l || t.omega_3 || t.bed_phone_filter || t.toilet;
    if (hasActivity) {
      // Format date part safely
      const dStr = new Date(t.date).toISOString().split('T')[0];
      activeDates.add(dStr);
    }
  });

  let streak = 0;
  let checkDateStr = todayStr;
  if (activeDates.has(checkDateStr)) {
    while (activeDates.has(checkDateStr)) {
      streak++;
      const nextDate = new Date(new Date(checkDateStr).getTime() - 86400000);
      checkDateStr = new Date(nextDate.getTime() - tzOffset).toISOString().split('T')[0];
    }
  } else {
    checkDateStr = yesterdayStr;
    while (activeDates.has(checkDateStr)) {
      streak++;
      const nextDate = new Date(new Date(checkDateStr).getTime() - 86400000);
      checkDateStr = new Date(nextDate.getTime() - tzOffset).toISOString().split('T')[0];
    }
  }

  // Get recent weight data (past 14) for chart
  const weightData = await query(
    'SELECT date, body_weight FROM daily_trackers WHERE user_id = ? AND body_weight IS NOT NULL ORDER BY date ASC LIMIT 14',
    [targetUserId]
  );

  const dates = weightData.map((d: any) => {
    const dt = new Date(d.date);
    return `${dt.getMonth() + 1}/${dt.getDate()}`;
  });
  const weights = weightData.map((d: any) => parseFloat(d.body_weight));

  const clientQuery = isAdminViewing ? `?client_id=${targetUserId}` : '';

  return (
    <DashboardClient
      username={targetUser.username}
      role={session.role}
      isAdminViewing={isAdminViewing}
      clientQuery={clientQuery}
      targetUserId={targetUserId}
      initialQuote={quote}
      dates={dates}
      weights={weights}
      program={program}
      profile={profile}
      todayStr={todayStr}
      todayLog={todayLog}
      yesterdayWeight={yesterdayWeight}
      schedule={schedule}
      totalMealsCount={totalMealsCount}
      eatenMealsCount={completedMeals.length}
      consumedCalories={consumedCalories}
      consumedProtein={Math.round(consumedProtein)}
      consumedCarbs={Math.round(consumedCarbs)}
      consumedFat={Math.round(consumedFat)}
      streak={streak}
    />
  );
}

