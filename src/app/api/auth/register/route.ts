import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { encrypt } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'ဤ Email သည် အသုံးပြုထားပြီးဖြစ်ပါသည်။' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get first trainer (admin)
    const admins = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    const trainerId = admins && admins.length > 0 ? admins[0].id : null;

    // Insert user
    const insertResult = await query(
      'INSERT INTO users (username, email, password, role, trainer_id) VALUES (?, ?, ?, "user", ?)',
      [username, email, hashedPassword, trainerId]
    );

    const userId = insertResult.insertId;

    if (!userId) {
      return NextResponse.json(
        { error: 'Registration လုပ်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။' },
        { status: 500 }
      );
    }

    // Create default program (12 weeks)
    await query(
      'INSERT INTO programs (user_id, duration_weeks, start_date) VALUES (?, 12, CURDATE())',
      [userId]
    );

    // Add default motivational quote
    await query(
      "INSERT INTO motivational_quotes (user_id, quote) VALUES (?, 'Believe in yourself and exceed your limits!')",
      [userId]
    );

    // Create session token
    const token = await encrypt({
      userId,
      role: 'user',
      username,
      email,
    });

    const response = NextResponse.json({ success: true });

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
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: 'ဆာဗာတွင် ချို့ယွင်းချက်ရှိနေပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ။' },
      { status: 500 }
    );
  }
}
