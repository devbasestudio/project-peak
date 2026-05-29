import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // URL to redirect to after successful sign-in
  const next = searchParams.get('next') ?? '/user/dashboard';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const user = data.user;
      
      // Check if user has a profile in public.profiles. If not, wait for trigger or ensure it's made.
      // Since we created the PostgreSQL trigger `on_auth_user_created`,
      // the profile record is automatically created in public.profiles.
      
      // Let's verify the user's role to see where we should redirect.
      // If the user's email is admin@projectpeak.com, let's redirect them to the admin dashboard.
      let redirectUrl = `${origin}${next}`;
      
      const { data: profile } = await createAdminClient()
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profile && profile.role === 'admin') {
        redirectUrl = `${origin}/admin/dashboard`;
      } else if (user.email === 'admin@projectpeak.com') {
        // Fallback fallback rule for admin account email
        redirectUrl = `${origin}/admin/dashboard`;
      }
      
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If there is an authentication error, redirect to login page with an error query
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
