import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { encrypt } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Query database for user
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Email သို့မဟုတ် Password မှားယွင်းနေပါသည်။' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify bcrypt password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email သို့မဟုတ် Password မှားယွင်းနေပါသည်။' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await encrypt({
      userId: user.id,
      role: user.role,
      username: user.username,
      email: user.email,
    });

    const response = NextResponse.json({ success: true, role: user.role });

    // Set cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'ဆာဗာတွင် ချို့ယွင်းချက်ရှိနေပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ။' },
      { status: 500 }
    );
  }
}
