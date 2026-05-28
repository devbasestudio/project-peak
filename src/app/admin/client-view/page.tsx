import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { query } from '@/lib/db';
import { redirect } from 'next/navigation';
import ClientViewClient from './ClientViewClient';

export default async function ClientViewPage(props: {
  searchParams: Promise<{ id?: string; week?: string }>;
}) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const clientId = searchParams.id || '';

  // Verify client belongs to trainer
  const clients = await query(
    "SELECT * FROM users WHERE id = ? AND trainer_id = ? AND role = 'user'",
    [clientId, session.userId]
  );
  const client = clients && clients.length > 0 ? clients[0] : null;

  if (!client) {
    redirect('/admin/dashboard');
  }

  // Fetch program details
  const programs = await query('SELECT * FROM programs WHERE user_id = ?', [clientId]);
  const program = programs && programs.length > 0 ? programs[0] : null;

  // Fetch checkins
  const checkins = await query(
    'SELECT * FROM weekly_checkins WHERE user_id = ? ORDER BY week_number DESC',
    [clientId]
  );

  const selectedWeek = searchParams.week ? parseInt(searchParams.week, 10) : null;

  return (
    <ClientViewClient
      client={client}
      program={program}
      checkins={checkins}
      selectedWeek={selectedWeek}
      clientId={clientId}
    />
  );
}
