import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';
import { resolveUserRouteTarget } from '@/lib/adminView';
import { redirect } from 'next/navigation';
import SetupProfileClient from './SetupProfileClient';

export const dynamic = 'force-dynamic';

export default async function SetupProfilePage(props: {
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

  // Get user details to ensure they exist
  const users = await query('SELECT username FROM users WHERE id = ?', [targetUserId]);
  if (!users || users.length === 0) {
    redirect('/login');
  }
  const username = users[0].username;

  // Retrieve existing baseline profile if any
  const profiles = await query('SELECT * FROM user_profiles WHERE user_id = ?', [targetUserId]);
  const initialProfile = profiles && profiles.length > 0 ? profiles[0] : null;

  return (
    <SetupProfileClient
      userId={targetUserId}
      username={username}
      initialProfile={initialProfile}
    />
  );
}
