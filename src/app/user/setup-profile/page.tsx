import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import SetupProfileClient from './SetupProfileClient';

export default async function SetupProfilePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'user') {
    redirect('/login');
  }

  // Get user details to ensure they exist
  const users = await query('SELECT username FROM users WHERE id = ?', [session.userId]);
  if (!users || users.length === 0) {
    redirect('/login');
  }
  const username = users[0].username;

  // Retrieve existing baseline profile if any
  const profiles = await query('SELECT * FROM user_profiles WHERE user_id = ?', [session.userId]);
  const initialProfile = profiles && profiles.length > 0 ? profiles[0] : null;

  return (
    <SetupProfileClient
      userId={session.userId}
      username={username}
      initialProfile={initialProfile}
    />
  );
}
