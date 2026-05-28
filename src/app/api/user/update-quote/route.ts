import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { userId, quote } = await request.json();
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

    // Security check: Only allow matching userId OR admin
    if (user.id !== userId && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!quote || quote.trim() === '') {
      return NextResponse.json({ error: 'Quote cannot be empty.' }, { status: 400 });
    }

    const { error: quoteError } = await supabase
      .from('motivational_quotes')
      .upsert({
        user_id: userId,
        quote: quote.trim(),
      }, { onConflict: 'user_id' });

    if (quoteError) throw quoteError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Update quote error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
