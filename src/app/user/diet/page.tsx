import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import DietClient from './DietClient';

export default async function DietPage(props: {
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

  // Get program details
  const programs = await query('SELECT * FROM programs WHERE user_id = ?', [targetUserId]);
  const program = programs && programs.length > 0 ? programs[0] : null;

  const targetCalories = program?.target_calories ?? 2000;
  const macrosP = program?.macros_p ?? 150;
  const macrosC = program?.macros_c ?? 200;
  const macrosF = program?.macros_f ?? 60;
  const programType = program?.program_type ?? 'skinnyfat_recomp';

  // Fetch dynamic nutrition items from database
  const nutritionItems = await query(
    'SELECT * FROM nutrition_items WHERE program_type = ? ORDER BY sort_order ASC, id ASC',
    [programType]
  );

  // Timezone-safe today string (YYYY-MM-DD)
  const todayObj = new Date();
  const tzOffset = todayObj.getTimezoneOffset() * 60000;
  const todayStr = new Date(todayObj.getTime() - tzOffset).toISOString().split('T')[0];

  // Fetch completed meal item IDs from nutrition_logs for today
  const completedLogs = await query(
    'SELECT nutrition_item_id FROM nutrition_logs WHERE user_id = ? AND date = ? AND completed = 1',
    [targetUserId, todayStr]
  );
  const initialCompletedItemIds = completedLogs.map((log: any) => log.nutrition_item_id);

  const clientQuery = isAdminViewing ? `?client_id=${targetUserId}` : '';

  return (
    <DietClient
      userId={targetUserId}
      isAdminViewing={isAdminViewing}
      clientQuery={clientQuery}
      targetCalories={targetCalories}
      macrosP={macrosP}
      macrosC={macrosC}
      macrosF={macrosF}
      nutritionItems={nutritionItems}
      initialCompletedItemIds={initialCompletedItemIds}
      todayStr={todayStr}
    />
  );
}


