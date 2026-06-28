import { decrypt } from '@/lib/session';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import ClientViewClient from './ClientViewClient';

export const dynamic = 'force-dynamic';

export default async function ClientViewPage(props: {
  searchParams: Promise<{ id?: string; week?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await decrypt();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const clientId = searchParams.id || '';
  const supabase = createAdminClient();

  // Verify client exists and is a user
  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('id, username, email, role')
    .eq('id', clientId)
    .eq('role', 'user')
    .maybeSingle();

  if (!clientProfile) {
    redirect('/admin/dashboard');
  }

  // Fetch program details
  const { data: programs } = await supabase
    .from('programs')
    .select('*')
    .eq('user_id', clientId);
  const program = programs && programs.length > 0 ? programs[0] : null;

  // Fetch checkins
  const { data: checkins } = await supabase
    .from('weekly_checkins')
    .select('*')
    .eq('user_id', clientId)
    .order('week_number', { ascending: false });

  const { data: dailyLogs } = await supabase
    .from('daily_trackers')
    .select('*')
    .eq('user_id', clientId)
    .order('date', { ascending: false })
    .limit(14);

  const { data: registration } = await supabase
    .from('program_registrations')
    .select('name, age, height, weight, phone, telegram_id, program_name, photo_front, photo_back, photo_side, intake_answers')
    .eq('user_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const selectedWeek = searchParams.week ? parseInt(searchParams.week, 10) : null;

  return (
    <ClientViewClient
      client={clientProfile}
      program={program}
      checkins={checkins || []}
      dailyLogs={dailyLogs || []}
      registration={registration || null}
      selectedWeek={selectedWeek}
      clientId={clientId}
    />
  );
}
