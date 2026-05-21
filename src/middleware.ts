import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude static paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session')?.value;
  const session = sessionCookie ? await decrypt(sessionCookie) : null;

  // Protect Admin dashboard
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (session.role !== 'admin') {
      // Redirect unauthorized users to user dashboard
      return NextResponse.redirect(new URL('/user/dashboard', request.url));
    }
  }

  // Protect User pages
  if (pathname.startsWith('/user')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      if (session.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      }
    }
  }

  // Redirect authenticated users away from landing page to their main dashboard page
  if (pathname === '/') {
    if (session) {
      if (session.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
