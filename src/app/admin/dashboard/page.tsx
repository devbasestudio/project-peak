import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const adminId = session.userId;

  // Get all clients for this admin
  const clients = await query(
    `SELECT u.id, u.username, u.email, p.duration_weeks, p.start_date 
     FROM users u 
     LEFT JOIN programs p ON u.id = p.user_id 
     WHERE u.trainer_id = ? AND u.role = 'user'`,
    [adminId]
  );

  // Get recent check-ins that need feedback
  const recentCheckins = await query(
    `SELECT wc.*, u.username 
     FROM weekly_checkins wc 
     JOIN users u ON wc.user_id = u.id 
     WHERE u.trainer_id = ? 
     ORDER BY wc.created_at DESC LIMIT 15`,
    [adminId]
  );

  // Get all new program registrations
  let registrations: any[] = [];
  try {
    registrations = await query('SELECT * FROM program_registrations ORDER BY created_at DESC');
  } catch (err) {
    console.error('Error fetching registrations:', err);
  }

  return (
    <AdminDashboardClient
      clients={clients}
      recentCheckins={recentCheckins}
      registrations={registrations}
    />
  );
}
