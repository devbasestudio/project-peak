import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, date, nutritionItemId, completed } = body;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = profile?.role || (user.email === 'admin@projectpeak.com' ? 'admin' : 'user');

    // Security check: Only allow matching user OR admin
    if (user.id !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!date || !nutritionItemId) {
      return NextResponse.json({ error: 'Date and nutritionItemId are required.' }, { status: 400 });
    }

    // Upsert into nutrition_logs
    const { error: nutritionError } = await supabase
      .from('nutrition_logs')
      .upsert({
        user_id: userId,
        date,
        nutrition_item_id: nutritionItemId,
        completed: !!completed,
      }, { onConflict: 'user_id, date, nutrition_item_id' });

    if (nutritionError) throw nutritionError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Save nutrition error:', err);
    return NextResponse.json({ error: 'Server error: ' + err.message }, { status: 500 });
  }
}
