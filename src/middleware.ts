import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude static assets and next internal paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // This response is mutated by Supabase's `setAll` whenever the auth token is
  // refreshed. Its cookies MUST be carried over to any redirect we return,
  // otherwise the browser keeps the stale/expired token and we bounce forever
  // between /login and the protected page (the classic Supabase SSR loop).
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Build a redirect response that preserves any refreshed auth cookies.
  const redirectTo = (path: string) => {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  };

  // IMPORTANT: do not run any logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve admin status once (used by several branches below).
  const resolveIsAdmin = async () => {
    if (!user) return false;
    if (user.email === 'admin@projectpeak.com') return true;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    return profile?.role === 'admin';
  };

  // Protect Admin dashboard
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return redirectTo('/login');
    }
    if (!(await resolveIsAdmin())) {
      return redirectTo('/user/dashboard');
    }
  }

  // Protect User pages
  if (pathname.startsWith('/user')) {
    if (!user) {
      return redirectTo('/login');
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (user) {
      return redirectTo((await resolveIsAdmin()) ? '/admin/dashboard' : '/user/dashboard');
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
