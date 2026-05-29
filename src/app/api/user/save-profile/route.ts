import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: Request) {
  try {
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    // Data access via service role (RLS blocks the authenticated client).
    const supabase = createAdminClient();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || (user.email === 'admin@projectpeak.com' ? 'admin' : 'user');

    const body = await request.json();
    const { height, weight, age, bodyFat, desiredBodyText } = body;
    let targetUserId = user.id;

    // If admin is managing, allow setting different client ID
    if (userRole === 'admin' && body.userId) {
      targetUserId = body.userId;
    }

    if (!height || !weight || !age || !bodyFat) {
      return NextResponse.json({ error: 'အချက်အလက်အားလုံး ပြည့်စုံစွာ ဖြည့်သွင်းပေးပါ' }, { status: 400 });
    }

    // Upsert user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: targetUserId,
        height_cm: parseFloat(height),
        starting_weight: parseFloat(weight),
        age: parseInt(age, 10),
        body_fat_percent: parseInt(bodyFat, 10),
        desired_body_text: desiredBodyText || '',
      }, { onConflict: 'user_id' });

    if (profileError) throw profileError;

    // Also insert or update the first daily tracker entry weight as baseline
    const today = new Date().toISOString().split('T')[0];
    const { error: trackerError } = await supabase
      .from('daily_trackers')
      .upsert({
        user_id: targetUserId,
        date: today,
        body_weight: parseFloat(weight),
      }, { onConflict: 'user_id, date' });

    if (trackerError) throw trackerError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save profile error:', err);
    return NextResponse.json({ error: 'ဆာဗာတွင် ချို့ယွင်းချက်ရှိနေပါသည်။ ' + err.message }, { status: 500 });
  }
}
