import { decrypt } from '@/lib/session';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await decrypt();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const supabase = createAdminClient();

  // Get all clients (users with role = 'user') with their program info
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      email,
      programs (
        duration_weeks,
        start_date
      )
    `)
    .eq('role', 'user');

  const clients = (profiles || []).map((p: any) => ({
    id: p.id,
    username: p.username,
    email: p.email,
    duration_weeks: p.programs?.[0]?.duration_weeks || null,
    start_date: p.programs?.[0]?.start_date || null,
  }));

  // Get recent check-ins that need feedback
  const { data: checkins } = await supabase
    .from('weekly_checkins')
    .select(`
      id,
      user_id,
      week_number,
      admin_feedback,
      created_at,
      profiles:user_id (
        username
      )
    `)
    .order('created_at', { ascending: false })
    .limit(15);

  const recentCheckins = (checkins || []).map((c: any) => ({
    id: c.id,
    user_id: c.user_id,
    username: c.profiles?.username || 'Client',
    week_number: c.week_number,
    admin_feedback: c.admin_feedback,
    created_at: c.created_at,
  }));

  // Get all program registrations
  let registrations: any[] = [];
  try {
    const { data } = await supabase
      .from('program_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    registrations = data || [];
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

